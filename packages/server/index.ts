import express from 'express';
import dotenv from 'dotenv';
import router from './routes';
import path from 'path';
import { readdirSync, readFileSync } from 'fs';
import { vectorStore } from './rag/vector-store';
import multer from 'multer';
import cors from 'cors';

dotenv.config();

const jobsDir = path.join(import.meta.dir, 'rag/jobs-criterias');
for (const file of readdirSync(jobsDir)) {
  if (!file.endsWith('.md')) continue;
  const role = path.basename(file, '.md');
  const text = readFileSync(path.join(jobsDir, file), 'utf-8');
  await vectorStore.indexRole(role, text);
}
console.log(`Vector store ready. Roles: ${vectorStore.listRoles().join(', ')}`);

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(router);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(413)
          .json({ error: 'File too large (max 5 MB per file)' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({ error: 'Too many files (max 20)' });
      }
      return res.status(400).json({ error: err.message });
    }

    // Non-multer errors → generic 500
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

const port = process.env.PORT || 3000;

app.listen(port, () =>
  console.log(`Server up and running on port http://localhost:${port}`)
);
