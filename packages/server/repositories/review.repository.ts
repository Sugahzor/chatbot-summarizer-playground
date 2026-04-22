import { PrismaClient, type Review, type Summary } from '../generated/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

export const reviewRepository = {
  async getReviews(productId: number, limit?: number): Promise<Review[]> {
    return prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
  getReviewSummary(productId: number): Promise<Summary | null> {
    return prisma.summary.findUnique({
      where: { productId },
    });
  },
  async storeReviewSummary(
    productId: number,
    summary: string
  ): Promise<Summary> {
    const now = new Date();
    const expiresAt = dayjs().add(7, 'day').toDate();
    const data = {
      content: summary,
      generatedAt: now,
      expiresAt,
      productId,
    };

    return prisma.summary.upsert({
      where: { productId },
      create: data,
      update: data,
    });
  },
};
