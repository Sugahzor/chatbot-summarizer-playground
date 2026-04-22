import { StarRating } from './StarRating';
import { useMutation, useQuery } from '@tanstack/react-query';
import { HiSparkles } from 'react-icons/hi2';
import { Button } from '../ui/button';
import { ReviewSkeleton } from './ReviewSkeleton';
import {
  reviewsApi,
  type GetReviewsResponse,
  type SummarizeResponse,
} from './reviewsApi';

type Props = {
  productId: number;
};

export const ReviewList = ({ productId }: Props) => {
  const reviewsQuery = useQuery<GetReviewsResponse>({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.fetchReviews(productId),
  });

  const summaryMutation = useMutation<SummarizeResponse>({
    mutationFn: () => reviewsApi.summarizeReviews(productId),
  });

  if (reviewsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (reviewsQuery.error) {
    return (
      <div className="text-red-500">Could not fetch reviews. Try again.</div>
    );
  }

  if (!reviewsQuery.data?.reviews.length) {
    return null;
  }

  const currentSummary =
    reviewsQuery.data.summary || summaryMutation.data?.summary;

  return (
    <div>
      <div className="mb-5">
        {currentSummary ? (
          <p>{currentSummary}</p>
        ) : (
          <div>
            <Button
              className="cursor-pointer"
              onClick={() => summaryMutation.mutate()}
              disabled={summaryMutation.isPending}
            >
              <HiSparkles className="mr-2" />
              Summarize
            </Button>
            {summaryMutation.isPending && (
              <div className="py-3">
                <ReviewSkeleton />
              </div>
            )}
            {summaryMutation.isError && (
              <div className="text-red-500 mt-2">
                Could not summarize. Please try again.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5">
        {reviewsQuery.data?.reviews?.map((review) => (
          <div key={review.id}>
            <div className="font-semibold">{review.author}</div>
            <div>
              <StarRating value={review.rating} />
            </div>
            <p className="py-2">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
