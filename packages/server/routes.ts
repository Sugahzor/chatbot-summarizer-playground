import express from 'express';
import type { Request, Response } from 'express';
import { chatController } from './controllers/chat.controller';
// import { PrismaClient } from './generated/client';
import { reviewController } from './controllers/review.controller';
import multer from 'multer';
import { cvScreeningController } from './controllers/cv-screening.controller';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
});

router.get('/', (req: Request, res: Response) =>
  res.send('Hello World, meow!')
);

router.get('/api/hello', (req: Request, res: Response) =>
  res.json({ message: 'Hello from the API!' })
);

router.post('/api/chat', chatController.sendMessage);

router.get('/api/products/:id/reviews', reviewController.getReviews);

router.post(
  '/api/products/:id/reviews/summarize',
  reviewController.summarizeReviews
);

// router.get('/api/products/:id/review-summary', reviewController.getReviewSummary);

router.get('/api/jobs/roles', cvScreeningController.listRoles);

router.post(
  '/api/screen-cvs',
  upload.array('cvs', 20),
  cvScreeningController.screen
);

export default router;
