'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Review } from '@/lib/types';

interface ProductReviewsProps {
  productId: string;
}

// We need to maintain state across tab changes, so use a module-level cache
const reviewsCache = new Map<string, {
  reviews: Review[];
  helpfulReviews: Set<string>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}>();

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const router = useRouter();
  const mountedRef = useRef(false);
  
  // Initialize state from cache or with defaults
  const [state, setState] = useState(() => {
    const cachedData = reviewsCache.get(productId);
    if (cachedData) {
      return cachedData;
    }
    
    // Default state if not in cache
    return {
      reviews: [] as Review[],
      helpfulReviews: new Set<string>(),
      loading: true,
      error: null as string | null,
      initialized: false
    };
  });
  
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  const REVIEWS_TO_SHOW = 3;
  
  // Load data only once on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    
    if (state.initialized) return;
    
    // Simulate API call
    const loadReviews = setTimeout(() => {
      const dummyReviews: Review[] = [
        {
          id: '1',
          productId,
          userId: 'user1',
          userName: 'Jane Smith',
          userAvatar: '/images/avatars/avatar-1.jpg',
          rating: 5,
          title: 'Excellent product, exceeded expectations',
          comment: "I absolutely love this product! The quality is outstanding and it looks even better in person. The material feels premium and durable. Shipping was fast and the packaging was secure. Would definitely recommend to anyone looking for a high-quality item.",
          date: '2023-10-15',
          verified: true,
          helpful: 24,
          images: ['/images/products/review-1-1.jpg', '/images/products/review-1-2.jpg'],
        },
        {
          id: '2',
          productId,
          userId: 'user2',
          userName: 'John Doe',
          userAvatar: '/images/avatars/avatar-2.jpg',
          rating: 4,
          title: 'Great value for the price',
          comment: "Very good product for the price. The only reason I'm giving 4 stars instead of 5 is because the color is slightly different from what was shown in the pictures. Other than that, I'm happy with my purchase.",
          date: '2023-09-28',
          verified: true,
          helpful: 12,
        },
        {
          id: '3',
          productId,
          userId: 'user3',
          userName: 'Robert Johnson',
          userAvatar: '/images/avatars/avatar-3.jpg',
          rating: 2,
          title: 'Not as described',
          comment: "I was disappointed with this purchase. The product doesn't match the description and feels cheaply made. I've returned it and am waiting for my refund.",
          date: '2023-09-15',
          verified: true,
          helpful: 8,
          response: {
            from: 'Store Support',
            comment: "We're sorry to hear about your experience. We've processed your return and the refund should appear in your account within 3-5 business days. Please reach out to our customer service if you have any further questions.",
            date: '2023-09-17'
          }
        },
        {
          id: '4',
          productId,
          userId: 'user4',
          userName: 'Emily Wilson',
          userAvatar: '/images/avatars/avatar-4.jpg',
          rating: 5,
          title: 'Perfect gift!',
          comment: 'Bought this as a gift for my husband and he loves it! The quality is excellent and it arrived earlier than expected. Will definitely be ordering from this store again.',
          date: '2023-09-10',
          verified: true,
          helpful: 5,
        },
        {
          id: '5',
          productId,
          userId: 'user5',
          userName: 'Michael Brown',
          userAvatar: '/images/avatars/avatar-5.jpg',
          rating: 3,
          title: 'Good but not great',
          comment: 'The product is okay, but I expected more based on the price. It does the job, but there are a few minor issues with the design that could be improved.',
          date: '2023-08-29',
          verified: false,
          helpful: 2,
        },
      ];
      
      const newState = {
        reviews: dummyReviews,
        helpfulReviews: new Set<string>(),
        loading: false,
        error: null,
        initialized: true
      };
      
      // Update both state and cache
      setState(newState);
      reviewsCache.set(productId, newState);
    }, 800);
    
    return () => clearTimeout(loadReviews);
  }, [productId, state.initialized]);
  
  // Update cache when state changes
  useEffect(() => {
    if (state.initialized) {
      reviewsCache.set(productId, state);
    }
  }, [state, productId]);
  
  // Memoize computed values to prevent unnecessary recalculations
  const { averageRating, ratingCounts, filteredReviews, displayedReviews, hasMoreReviews } = useMemo(() => {
    // Calculate rating statistics
    const avgRating = state.reviews.length
      ? state.reviews.reduce((sum, review) => sum + review.rating, 0) / state.reviews.length
      : 0;
      
    const counts = state.reviews.reduce(
      (counts, review) => {
        counts[review.rating - 1]++;
        return counts;
      },
      [0, 0, 0, 0, 0]
    );
    
    // Filter reviews based on rating filter
    const filtered = ratingFilter
      ? state.reviews.filter(review => review.rating === ratingFilter)
      : state.reviews;
      
    // Get the reviews to display based on showAll flag
    const displayed = showAll
      ? filtered
      : filtered.slice(0, REVIEWS_TO_SHOW);
      
    const hasMore = filtered.length > displayed.length;
    
    return {
      averageRating: avgRating,
      ratingCounts: counts,
      filteredReviews: filtered,
      displayedReviews: displayed,
      hasMoreReviews: hasMore
    };
  }, [state.reviews, ratingFilter, showAll, REVIEWS_TO_SHOW]);
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Mark a review as helpful
  const markAsHelpful = (reviewId: string) => {
    if (state.helpfulReviews.has(reviewId)) {
      return; // Already marked as helpful
    }
    
    const newHelpfulReviews = new Set(state.helpfulReviews);
    newHelpfulReviews.add(reviewId);
    
    // Update the review count in the UI and cache
    setState(prevState => {
      const updatedReviews = prevState.reviews.map(review => 
        review.id === reviewId
          ? { ...review, helpful: (review.helpful || 0) + 1 }
          : review
      );
      
      return {
        ...prevState,
        reviews: updatedReviews,
        helpfulReviews: newHelpfulReviews
      };
    });
    
    // In a real app, you would make an API call here
  };

  // Handle write review button click
  const handleWriteReview = () => {
    // In a real app, you might check if the user is logged in
    router.push(`/products/${productId}/write-review`);
  };

  // Don't re-render the entire component when showing more reviews
  const toggleShowAll = () => {
    setShowAll(prevState => !prevState);
  };
  
  // Don't re-render the entire component when filtering
  const toggleRatingFilter = (rating: number) => {
    setRatingFilter(prevFilter => prevFilter === rating ? null : rating);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Customer Reviews</h2>
      
      {state.loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D23F57]"></div>
        </div>
      ) : state.error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          {state.error}
        </div>
      ) : state.reviews.length === 0 ? (
        <div className="text-center py-10 space-y-4">
          <p className="text-gray-500">This product has no reviews yet. Be the first to share your thoughts!</p>
          <Button 
            onClick={handleWriteReview}
            className="bg-[#D23F57] hover:bg-[#E6536B] text-white"
          >
            Write a Review
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-8">
          {/* Rating Summary */}
          <div className="md:col-span-4 bg-gray-50 p-6 rounded-lg space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Based on {state.reviews.length} reviews
              </div>
            </div>
            
            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating - 1];
                const percentage = state.reviews.length
                  ? Math.round((count / state.reviews.length) * 100)
                  : 0;
                
                return (
                  <button
                    key={rating}
                    onClick={() => toggleRatingFilter(rating)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors ${
                      ratingFilter === rating
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-[40px]">
                      <span>{rating}</span>
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 min-w-[40px] text-right">
                      {count}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Write Review Button */}
            <Button 
              onClick={handleWriteReview}
              className="w-full bg-[#D23F57] hover:bg-[#E6536B] text-white"
            >
              Write a Review
            </Button>
          </div>
          
          {/* Reviews List */}
          <div className="md:col-span-8 space-y-6">
            {/* Filter info */}
            {ratingFilter && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="text-sm">
                  Showing reviews with {ratingFilter} {ratingFilter === 1 ? 'star' : 'stars'}
                </span>
                <button
                  onClick={() => setRatingFilter(null)}
                  className="text-sm text-[#D23F57] hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
            
            {/* Reviews */}
            <div className="space-y-6">
              {displayedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex flex-wrap justify-between mb-2">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <Image
                          src={review.userAvatar}
                          alt={review.userName}
                          width={40}
                          height={40}
                          className="rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/images/avatars/default-avatar.jpg';
                          }}
                        />
                      ) : (
                        <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {review.userName}
                          {review.verified && (
                            <span className="ml-1 text-green-600 flex items-center text-xs font-normal">
                              <Check className="h-3 w-3" />
                              <span>Verified Purchase</span>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.date)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Rating */}
                    <div className="flex mt-2 sm:mt-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <div className="space-y-3">
                    <h3 className="font-medium">{review.title}</h3>
                    <p className="text-gray-600">{review.comment}</p>
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative h-16 w-16 rounded-md overflow-hidden">
                            <Image
                              src={image}
                              alt={`Review image ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/images/placeholder-product.jpg';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Seller Response */}
                    {review.response && (
                      <div className="bg-gray-50 p-3 rounded-md mt-3 text-sm">
                        <div className="font-medium">{review.response.from} responded:</div>
                        <div className="mt-1">{review.response.comment}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(review.response.date)}
                        </div>
                      </div>
                    )}
                    
                    {/* Helpful Button */}
                    <button
                      onClick={() => markAsHelpful(review.id)}
                      className={`flex items-center gap-1 text-sm mt-2 px-3 py-1 rounded-full ${
                        state.helpfulReviews.has(review.id)
                          ? 'bg-gray-100 text-gray-600'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      disabled={state.helpfulReviews.has(review.id)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>
                        {state.helpfulReviews.has(review.id) ? 'Marked as helpful' : 'Helpful'} 
                        {review.helpful ? ` (${review.helpful})` : ''}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Show More Button */}
            {hasMoreReviews && (
              <button
                onClick={toggleShowAll}
                className="flex items-center gap-1 text-[#D23F57] font-medium hover:underline mx-auto"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Show All ({filteredReviews.length - REVIEWS_TO_SHOW} more)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}