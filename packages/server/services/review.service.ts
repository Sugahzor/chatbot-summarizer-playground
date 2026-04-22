import { llmClient } from '../llm/client';
import { reviewRepository } from '../repositories/review.repository';

export const reviewService = {
  async summarizeReviews(productId: number): Promise<string> {
    const existingSummary = await reviewRepository.getReviewSummary(productId);
    if (existingSummary) {
      return existingSummary;
    }

    const reviews = await reviewRepository.getReviews(productId, 10);

    if (reviews.length === 0) {
      return 'No reviews available for this product.';
    }

    const joinedReviews = reviews.map((r) => r.content).join('\n\n');

    // const prompt = template.replace('{{reviews}}', joinedReviews);

    // const { text: summary } = await llmClient.generateText({
    //   model: 'gpt-4.1',
    //   prompt,
    //   temperature: 0.2,
    //   maxTokens: 500,
    // });

    // const { summary } = await llmClient.summerize(joinedReviews);

    const summary = await llmClient.summerizeReviews(joinedReviews);

    await reviewRepository.storeReviewSummary(productId, summary);

    return summary;
  },
};
