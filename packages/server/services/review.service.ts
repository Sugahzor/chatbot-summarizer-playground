import type { Review } from '../generated/client';
import { llmClient } from '../llm/client';
import { reviewRepository } from '../repositories/review.repository';
import template from '../prompts/summarize-reviews.txt';
import { response } from 'express';

export const reviewService = {
  async getReviews(productId: number): Promise<Review[]> {
    return reviewRepository.getReviews(productId);
  },
  async summarizeReviews(productId: number): Promise<string> {
    const existingSummary = await reviewRepository.getReviewSummary(productId);
    if (existingSummary && existingSummary.expiresAt > new Date()) {
      return existingSummary.content;
    }

    const reviews = await reviewRepository.getReviews(productId, 10);

    if (reviews.length === 0) {
      return 'No reviews available for this product.';
    }

    const joinedReviews = reviews.map((r) => r.content).join('\n\n');

    const prompt = template.replace('{{reviews}}', joinedReviews);

    const { text: summary } = await llmClient.generateText({
      model: 'gpt-4.1',
      prompt,
      temperature: 0.2,
      maxTokens: 500,
    });

    await reviewRepository.storeReviewSummary(productId, summary);

    return summary;
  },
};
