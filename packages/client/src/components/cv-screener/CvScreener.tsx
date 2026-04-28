import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

type Result = {
  fileName: string;
  role: string;
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  error?: string;
};

const API_BASE = 'http://localhost:3000';
const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const CvScreener = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    axios
      .get<{ roles: string[] }>(`${API_BASE}/api/jobs/roles`)
      .then(({ data }) => {
        setRoles(data.roles);
        if (data.roles.length) setRole(data.roles[0]);
      });
  }, []);

  const validateAndAdd = (picked: File[]) => {
    setWarning(null);

    const pdfs = picked.filter((f) => f.type === 'application/pdf');
    const rejectedNonPdf = picked.length - pdfs.length;

    const withinSize = pdfs.filter((f) => f.size <= MAX_FILE_SIZE_BYTES);
    const rejectedTooBig = pdfs.length - withinSize.length;

    const seen = new Set(
      files.map((f) => `${f.name}-${f.size}-${f.lastModified}`)
    );
    const newOnes = withinSize.filter(
      (f) => !seen.has(`${f.name}-${f.size}-${f.lastModified}`)
    );
    const rejectedDup = withinSize.length - newOnes.length;

    const merged = [...files, ...newOnes];
    const capped = merged.slice(0, MAX_FILES);
    const rejectedOverCount = merged.length - capped.length;

    const messages: string[] = [];
    if (rejectedNonPdf) messages.push(`${rejectedNonPdf} non-PDF skipped`);
    if (rejectedTooBig)
      messages.push(`${rejectedTooBig} over ${MAX_FILE_SIZE_MB} MB skipped`);
    if (rejectedDup) messages.push(`${rejectedDup} duplicate(s) skipped`);
    if (rejectedOverCount)
      messages.push(`${rejectedOverCount} over ${MAX_FILES}-file cap skipped`);

    if (messages.length) setWarning(messages.join(' · '));
    setFiles(capped);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setWarning(null);
  };

  const clearAll = () => {
    setFiles([]);
    setWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length || !role) return;

    const formData = new FormData();
    formData.append('role', role);
    files.forEach((f) => formData.append('cvs', f));

    setLoading(true);
    try {
      const { data } = await axios.post<{ results: Result[] }>(
        `${API_BASE}/api/screen-cvs`,
        formData
      );
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    validateAndAdd(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block mt-1 border rounded px-2 py-1"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3 items-stretch">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Choose files
          </button>

          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`flex-1 border-2 border-dashed rounded px-4 py-2 text-sm flex items-center justify-center transition-colors ${
              dragOver
                ? 'border-black bg-gray-100'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            {dragOver ? 'Drop PDFs here' : 'or drag & drop PDFs here'}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => {
            validateAndAdd(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
          className="hidden"
        />

        <p className="text-xs text-gray-500">
          PDF only · max {MAX_FILES} files · up to {MAX_FILE_SIZE_MB} MB each
        </p>

        {warning && <p className="text-xs text-orange-600">{warning}</p>}

        {files.length > 0 && (
          <ul className="text-sm text-gray-600 space-y-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${f.size}-${f.lastModified}`}
                className="flex items-center gap-2"
              >
                <span>{f.name}</span>
                <span className="text-gray-400">
                  ({(f.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${f.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!files.length || !role || loading}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? 'Screening…' : `Screen ${files.length} CV(s)`}
          </button>
          {files.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={`${r.fileName}-${i}`} className="border rounded p-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold">{r.fileName}</h3>
              <span className="text-2xl font-bold">{r.score}/10</span>
            </div>
            <p className="text-xs text-gray-500">Role: {r.role}</p>
            {r.error ? (
              <p className="text-red-600 mt-2">Error: {r.error}</p>
            ) : (
              <>
                <p className="mt-2 text-sm">{r.recommendation}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <h4 className="font-medium text-green-700">Strengths</h4>
                    <ul className="list-disc list-inside">
                      {r.strengths.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-700">Gaps</h4>
                    <ul className="list-disc list-inside">
                      {r.gaps.map((g, j) => (
                        <li key={j}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
