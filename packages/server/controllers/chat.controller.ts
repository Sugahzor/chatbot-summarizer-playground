import type { Request, Response } from 'express';
import z from 'zod';
import { chatService } from '../services/chat.service';

const chatSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be less than 1000 characters'),
  conversationId: z.uuid(),
});

export const chatController = {
  async sendMessage(req: Request, res: Response) {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(z.treeifyError(parseResult.error));
      return;
    }
    try {
      const { prompt, conversationId } = req.body;
      const response = await chatService.sendMessage(prompt, conversationId);
      res.json({
        message: response.message,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'An error occurred while processing your request.' });
    }
  },
};
