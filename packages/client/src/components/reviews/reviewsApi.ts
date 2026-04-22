import axios from 'axios';

type Review = {
  id: number;
  author: string;
  content: string;
  rating: number;
  createdAt: string;
};
export type GetReviewsResponse = {
  reviews: Review[];
  summary: string | null;
};
export type SummarizeResponse = {
  summary: string;
};

export const reviewsApi = {
  fetchReviews(productId: number) {
    return axios
      .get<GetReviewsResponse>(`/api/products/${productId}/reviews`)
      .then((res) => res.data);
  },

  summarizeReviews(productId: number) {
    return axios
      .post<SummarizeResponse>(`/api/products/${productId}/reviews/summarize`)
      .then((res) => res.data);
  },
};
