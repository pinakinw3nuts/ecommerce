import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getCategories } from '@/services/categories';

export interface CategoryOption {
  value: string;
  label: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch categories with SWR
  const { data, error: swrError } = useSWR(
    'categories-list',
    () => getCategories({ pageSize: 100 }), // Get up to 100 categories
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  );

  useEffect(() => {
    if (swrError) {
      console.error('Failed to load categories:', swrError);
      setError(swrError);
      setIsLoading(false);
      return;
    }

    if (data) {
      // Transform categories to the format needed for the dropdown
      const categoryOptions = data.categories.map(category => ({
        value: category.id,
        label: category.name
      }));
      
      setCategories(categoryOptions);
      setIsLoading(false);
    }
  }, [data, swrError]);

  return { categories, isLoading, error };
} 