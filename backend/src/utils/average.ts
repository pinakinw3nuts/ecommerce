/**
 * Calculate the average rating from an array of ratings
 * Returns a number with one decimal place
 * 
 * @param ratings Array of rating values (1-5)
 * @returns Average rating rounded to one decimal place
 */
export function calculateAverageRating(ratings: number[]): number {
  if (!ratings.length) {
    return 0;
  }
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const average = sum / ratings.length;
  
  // Round to one decimal place
  return Math.round(average * 10) / 10;
} 