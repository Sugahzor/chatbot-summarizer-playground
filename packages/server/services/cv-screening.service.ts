import { extractText, getDocumentProxy } from 'unpdf';
import { vectorStore } from '../rag/vector-store';
import { llmClient } from '../llm/client';
import { z } from 'zod';

type CvInput = {
  fileName: string;
  buffer: Buffer;
};

type CvScreeingResult = {
  fileName: string;
  role: string;
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  error?: string;
};

const verdictSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendation: z.string(),
});

const parsePdf = async (buffer: Buffer): Promise<string> => {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
};

const screenOne = async (
  { fileName, buffer }: CvInput,
  role: string
): Promise<CvScreeingResult> => {
  try {
    const cvText = await parsePdf(buffer);

    const relevant = await vectorStore.search(cvText, role, 3);
    const context = relevant
      .map((topResult) => topResult.text)
      .join('\n\n---\n\n');

    const { text } = await llmClient.generateText({
      instructions:
        `You screen CVs for the role of "${role}". Return ONLY valid JSON ` +
        `with keys: score (number 1-10), strengths (string[]), gaps (string[]), ` +
        `recommendation (string).`,
      prompt: `JOB CRITERIA:\n${context}\n\nCV:\n${cvText}`,
      maxTokens: 600,
    });

    const parsed = verdictSchema.parse(JSON.parse(text));
    return { ...parsed, fileName, role };
  } catch (error) {
    return {
      fileName: '',
      role: '',
      score: 0,
      strengths: [],
      gaps: [],
      recommendation: 'Failed to process CV.',
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
};
export const cvScreeningService = {
  async screenMany(cvs: CvInput[], role: string): Promise<CvScreeingResult[]> {
    return Promise.all(cvs.map((cv) => screenOne(cv, role)));
  },
};
