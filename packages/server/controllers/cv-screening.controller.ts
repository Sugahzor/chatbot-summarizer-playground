import type { Request, Response } from 'express';
import { vectorStore } from '../rag/vector-store';
import { cvScreeningService } from '../services/cv-screening.service';

export const cvScreeningController = {
  async screen(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    const role = req.body.role as string | undefined;

    if (!files?.length) {
      return res.status(400).json({ error: 'No CVs uploaded' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }

    if (!vectorStore.listRoles().includes(role)) {
      return res.status(400).json({
        error: `Role not supported: ${role} - if you wish to support it, please add criteria file.`,
      });
    }

    const results = await cvScreeningService.screenMany(
      files.map((file) => ({
        fileName: file.originalname,
        buffer: file.buffer,
      })),
      role
    );
    res.json({ role, results });
  },

  listRoles(_req: Request, res: Response) {
    res.json({ roles: vectorStore.listRoles() });
  },
};
