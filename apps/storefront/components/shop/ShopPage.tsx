'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { ProductCard } from '@/components/shop/ProductCard';

// Default single "All Products" category as fallback
const defaultCategories = [
  { id: 'all', name: 'All Products' }
];

// Sort options
const sortOptions = [
  { id: 'newest', name: 'Newest' },
  { id: 'price-asc', name: 'Price: Low to High' },
  { id: 'price-desc', name: 'Price: High to Low' },
  { id: 'popular', name: 'Popularity' },
  { id: 'name-asc', name: 'Name: A to Z' },
  { id: 'name-desc', name: 'Name: Z to A' },
  { id: 'rating-desc', name: 'Highest Rated' },
];

// Min and max price range
const MIN_PRICE = 0;
const MAX_PRICE = 10000;

function NoProductsFound({ 
  isError, 
  errorMessage, 
  searchTerm, 
  onReset 
}: { 
  isError: boolean; 
  errorMessage: string | null;
  searchTerm?: string;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {isError ? (
        <>
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-6">
            {errorMessage || 'We encountered an error while fetching products. Please try again.'}
          </p>
        </>
      ) : (
        <>
          <Search className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? `We couldn't find any products matching "${searchTerm}".` 
              : 'No products match the selected filters.'}
          </p>
        </>
      )}
      
      <Button 
        onClick={onReset} 
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );
}

export default function ShopPage({ 
  searchParams 
}: { 
  searchParams: Record<string, string | string[] | undefined>
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Parse search params with defaults
  const category = typeof searchParams.category === 'string' ? searchParams.category : 'all';
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) || 1 : 1;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) || MIN_PRICE : MIN_PRICE;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) || MAX_PRICE : MAX_PRICE;
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  
  // State for products and loading
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState(search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    category,
    sort,
    page,
    minPrice,
    maxPrice,
    search
  });
  
  // State for price range slider
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPrice,
    maxPrice
  ]);
  
  // Ref to track if user is currently dragging the slider
  const isDraggingRef = useRef(false);
  
  // State for view mode (grid or list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Debounce price range changes to avoid too many updates but make it responsive
  const debouncedPriceRange = useDebounce(priceRange, 300);
  
  // Products per page
  const PRODUCTS_PER_PAGE = 6;
  
  // Force a minimum total for testing pagination
  const FORCE_MINIMUM_TOTAL = 14;
  
  // For debugging - log initial params
  useEffect(() => {
    // Initial search params are available here, but don't log them directly
    // to avoid the Next.js warning
  }, []);
  
  // Debug the initial state
  useEffect(() => {
    // Log only the client-side state, not the original searchParams
    console.log('Initial activeFilters state:', activeFilters);
  }, [activeFilters]);
  
  // Check if we're in a browser environment and parse URL directly
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const urlCategory = url.searchParams.get('category') || 'all';
      const urlSearch = url.searchParams.get('search') || '';
      const urlSort = url.searchParams.get('sort') || 'newest';
      const urlPage = parseInt(url.searchParams.get('page') || '1');
      const urlMinPrice = parseInt(url.searchParams.get('minPrice') || MIN_PRICE.toString());
      const urlMaxPrice = parseInt(url.searchParams.get('maxPrice') || MAX_PRICE.toString());
      
      // Validate price range values to ensure they're within bounds
      const validMinPrice = isNaN(urlMinPrice) ? MIN_PRICE : Math.max(MIN_PRICE, Math.min(MAX_PRICE, urlMinPrice));
      const validMaxPrice = isNaN(urlMaxPrice) ? MAX_PRICE : Math.max(validMinPrice, Math.min(MAX_PRICE, urlMaxPrice));
      
      // Make sure our state matches the URL
      if (urlCategory !== activeFilters.category || 
          urlSearch !== activeFilters.search || 
          urlSort !== activeFilters.sort || 
          urlPage !== activeFilters.page || 
          validMinPrice !== activeFilters.minPrice || 
          validMaxPrice !== activeFilters.maxPrice) {
        
        setActiveFilters({
          category: urlCategory,
          search: urlSearch,
          sort: urlSort,
          page: urlPage,
          minPrice: validMinPrice,
          maxPrice: validMaxPrice
        });
        
        // Also update search query for the input field
        if (urlSearch) {
          setSearchQuery(urlSearch);
        }
        
        // Update price range slider
        setPriceRange([validMinPrice, validMaxPrice]);
      }
    }
  }, []);
  
  // Initialize state when search params change (like from header search)
  useEffect(() => {
    // Always update search query when URL changes
    if (search !== searchQuery) {
      setSearchQuery(search);
    }
    
    // Validate price range values
    const validMinPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, minPrice));
    const validMaxPrice = Math.max(validMinPrice, Math.min(MAX_PRICE, maxPrice));
    
    // Always update price range slider when URL params change
    if (validMinPrice !== priceRange[0] || validMaxPrice !== priceRange[1]) {
      setPriceRange([validMinPrice, validMaxPrice]);
    }
    
    // Always update active filters when URL params change
    if (category !== activeFilters.category ||
        sort !== activeFilters.sort ||
        page !== activeFilters.page ||
        validMinPrice !== activeFilters.minPrice ||
        validMaxPrice !== activeFilters.maxPrice ||
        search !== activeFilters.search) {
      
      setActiveFilters({
        category,
        sort,
        page,
        minPrice: validMinPrice,
        maxPrice: validMaxPrice,
        search
      });
    }
    
  }, [search, category, sort, page, minPrice, maxPrice]); // Removed dependencies that can cause loops
  
  // Update URL with filters
  const updateFilters = (newParams: Record<string, string | number | null>) => {
    try {
      // Create a new URLSearchParams object based on current searchParams
      const params = new URLSearchParams();
      
      // Start with current active filters
      if (activeFilters.category !== 'all') params.set('category', activeFilters.category);
      if (activeFilters.sort !== 'newest') params.set('sort', activeFilters.sort);
      if (activeFilters.page !== 1) params.set('page', activeFilters.page.toString());
      if (activeFilters.minPrice > 0) params.set('minPrice', activeFilters.minPrice.toString());
      if (activeFilters.maxPrice < MAX_PRICE) params.set('maxPrice', activeFilters.maxPrice.toString());
      if (activeFilters.search) params.set('search', activeFilters.search);
      
      // Log current params for debugging
      console.log('Current URL params before update:', Object.fromEntries(params.entries()));
      
      // Update with new params
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
          console.log(`Deleted param: ${key}`);
        } else {
          params.set(key, value.toString());
          console.log(`Updated param: ${key} = ${value}`);
        }
      });
      
      // Reset page when changing filters other than page
      if (!('page' in newParams) && Object.keys(newParams).length > 0) {
        params.set('page', '1');
      }
      
      // Build new URL
      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('New URL after update:', newUrl);
      
      // Update active filters state
      setActiveFilters(prev => {
        const updated = {
          ...prev,
          ...Object.fromEntries(
            Object.entries(newParams).map(([key, value]) => [
              key, 
              value === null ? 
                (key === 'category' ? 'all' : 
                 key === 'sort' ? 'newest' : 
                 key === 'page' ? 1 : 
                 key === 'minPrice' ? MIN_PRICE : 
                 key === 'maxPrice' ? MAX_PRICE : 
                 '') : 
                value
            ])
          )
        };
        console.log('Updated activeFilters:', updated);
        return updated;
      });
      
      // Navigate to new URL
      router.push(newUrl);
    } catch (error) {
      console.error('Error updating filters:', error);
    }
  };
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.categories)) {
          // Add the "All Products" category at the beginning
          const allCategories = [
            { id: 'all', name: 'All Products' },
            ...data.categories.map((cat: any) => ({
              id: cat.id || cat._id || cat.slug || '',
              name: cat.name || '',
              count: cat.productCount || 0
            }))
          ];
          
          setCategories(allCategories);
        } else if (Array.isArray(data)) {
          // Handle array format response
          const allCategories = [
            { id: 'all', name: 'All Products' },
            ...data.map((cat: any) => ({
              id: cat.id || cat._id || cat.slug || '',
              name: cat.name || '',
              count: cat.productCount || 0
            }))
          ];
          
          setCategories(allCategories);
        } else {
          console.error('Invalid category data format:', data);
          // Fallback to default categories
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories
        setCategories(defaultCategories);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products based on filters
  useEffect(() => {
    // Track when the loading started
    const loadStartTime = Date.now();
    
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build API URL with filters
        const apiUrl = new URL('/api/products', window.location.origin);
        
        // Only add category param if it's not 'all'
        if (activeFilters.category !== 'all') {
          apiUrl.searchParams.set('category', activeFilters.category);
        }
        
        // Add other filter params
        apiUrl.searchParams.set('sort', activeFilters.sort);
        apiUrl.searchParams.set('page', activeFilters.page.toString());
        apiUrl.searchParams.set('limit', PRODUCTS_PER_PAGE.toString());
        apiUrl.searchParams.set('minPrice', activeFilters.minPrice.toString());
        apiUrl.searchParams.set('maxPrice', activeFilters.maxPrice.toString());
        
        // Add search query if it exists
        if (activeFilters.search) {
          apiUrl.searchParams.set('search', activeFilters.search);
        }
        
        console.log('API URL with params:', apiUrl.toString());
        
        // Add a timeout to the fetch to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(apiUrl.toString(), {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const data = await response.json();
          
          // Format products to match ProductCard component expectations
          const formatProduct = (product: any) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            discountedPrice: product.discountedPrice || null,
            discountPercentage: product.discountPercentage || null,
            rating: product.rating || null,
            image: product.mediaUrl || '/images/placeholder.jpg',
            description: product.description || '',
            // Add any other fields needed
          });
          
          // Handle different response formats
          if (Array.isArray(data)) {
            console.log('Products fetched (array format):', data.length);
            const formattedProducts = data.map(formatProduct);
            setProducts(formattedProducts);
            setTotalProducts(data.length || 0);
          } else if (data.products && Array.isArray(data.products)) {
            console.log('Products fetched:', data.products.length, 'of total:', data.total);
            const formattedProducts = data.products.map(formatProduct);
            setProducts(formattedProducts);
            
            // Use the actual total from API response
            const apiTotal = data.total || data.products.length;
            setTotalProducts(apiTotal);
          } else if (data.data && Array.isArray(data.data)) {
            // Handle API response with data property
            console.log('Products fetched (data property):', data.data.length, 'of total:', data.meta?.total);
            const formattedProducts = data.data.map(formatProduct);
            setProducts(formattedProducts);
            
            // Use the meta info for pagination
            if (data.meta) {
              setTotalProducts(data.meta.total || data.data.length);
            } else {
              setTotalProducts(data.data.length);
            }
          } else {
            console.error('Invalid response format from API:', data);
            throw new Error('Invalid response format from API');
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.error('Request timed out');
            throw new Error('Request timed out. Please try again later.');
          }
          throw error;
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        
        // Set empty products instead of using mock data
        setProducts([]);
        setTotalProducts(0);
      } finally {
        // Ensure minimum loading time of 500ms to prevent UI flashing
        const loadTime = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, 500 - loadTime);
        
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    };
    
    fetchProducts();
  }, [activeFilters]);
  
  // Update search when debouncedSearch changes
  useEffect(() => {
    if (debouncedSearch !== activeFilters.search) {
      updateFilters({ search: debouncedSearch || null });
    }
  }, [debouncedSearch]);
  
  // Automatically apply price range filter when values change after debounce
  useEffect(() => {
    // Apply filter whenever debounced price range changes
    // This triggers after the user has stopped sliding for the debounce duration
    if (debouncedPriceRange.length === 2) {
      console.log('Auto-applying debounced price range:', debouncedPriceRange);
      
      const [minValue, maxValue] = debouncedPriceRange;
      
      // Only update if the values are different from the current filter values
      if (minValue !== activeFilters.minPrice || maxValue !== activeFilters.maxPrice) {
        updateFilters({
          minPrice: minValue === MIN_PRICE ? null : minValue,
          maxPrice: maxValue === MAX_PRICE ? null : maxValue,
          page: 1 // Reset to page 1 when changing price range
        });
      }
    }
  }, [debouncedPriceRange, activeFilters.minPrice, activeFilters.maxPrice, updateFilters]);
  
  // Update price filter state when URL parameters change
  useEffect(() => {
    // Only update slider if user is not currently dragging it
    if (!isDraggingRef.current) {
      // Update price range slider based on URL parameters
      const urlMinPrice = typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) || MIN_PRICE : MIN_PRICE;
      const urlMaxPrice = typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) || MAX_PRICE : MAX_PRICE;
      
      console.log('Updating slider from URL params:', { urlMinPrice, urlMaxPrice });
      setPriceRange([urlMinPrice, urlMaxPrice]);
    }
  }, [searchParams.minPrice, searchParams.maxPrice]);
  
  // Calculate total pages - ensure we properly round up for any remainder
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  // Force pagination to be visible for testing
  const shouldShowPagination = true;

  // Debug log for pagination
  useEffect(() => {
    console.log('Pagination info:', {
      totalProducts,
      PRODUCTS_PER_PAGE,
      totalPages,
      currentPage: activeFilters.page,
      shouldShowPagination
    });
  }, [totalProducts, activeFilters.page]);
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    // Calculate total pages based on API response
    const displayedTotalPages = totalPages;
    
    console.log(`Generating page numbers with total: ${totalProducts}, pages: ${displayedTotalPages}`);
    
    const pages = [];
    const maxVisiblePages = 5;
    
    if (displayedTotalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= displayedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, activeFilters.page - 1);
      let end = Math.min(displayedTotalPages - 1, activeFilters.page + 1);
      
      // Adjust if at the beginning or end
      if (activeFilters.page <= 2) {
        end = 4;
      } else if (activeFilters.page >= displayedTotalPages - 1) {
        start = displayedTotalPages - 3;
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < displayedTotalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (displayedTotalPages > 1) {
        pages.push(displayedTotalPages);
      }
    }
    
    console.log('Generated page numbers:', pages);
    return pages;
  };
  
  // Find the matching category display name
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'all') return 'All Products';
    
    // Check if it's a test category (test01, test08, etc.)
    if (/^test\d+$/i.test(categoryId)) {
      // Format the test category name nicely
      return `Test Category ${categoryId.substring(4)}`;
    }
    
    // Find the category with the matching ID or slug
    const category = categories.find((c: any) => 
      c.id === categoryId || c.slug === categoryId
    );
    
    // Return the category name if found, otherwise return the ID with first letter capitalized
    return category ? category.name : 
      categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };
  
  // Handler for category filter
  const handleCategoryFilter = (categoryId: string) => {
    console.log(`Category selected: ${categoryId}`);
    
    // Clear search query when changing category
    setSearchQuery('');
    
    // Handle "test" categories specially - they need to be preserved exactly as is
    let categoryParam = categoryId === 'all' ? null : categoryId;
    
    // Make sure we're using the right ID format for the category
    // Some categories might have different id/slug formats
    const foundCategory = categories.find((c: any) => 
      c.id === categoryId || c.slug === categoryId
    );
    
    // Use the category ID if found, otherwise use the provided ID
    if (foundCategory) {
      categoryParam = foundCategory.id;
    }
    
    // Update URL and state in one call
    updateFilters({
      category: categoryParam,
      search: null,
      page: 1
    });
    
    // Log what's happening
    console.log(`Category filter applied: ${categoryId} (param: ${categoryParam})`);
  };
  
  // Handler for price slider change (gets called continuously during dragging)
  const handlePriceRangeChange = (values: number[]) => {
    try {
      if (!Array.isArray(values) || values.length !== 2) {
        console.error('Invalid price range values:', values);
        return;
      }
      
      // Ensure values are within the valid range
      const minValue = Math.max(MIN_PRICE, Math.min(MAX_PRICE, values[0]));
      const maxValue = Math.max(minValue, Math.min(MAX_PRICE, values[1]));
      
      // Update local state - the debounced effect will auto-apply after user stops sliding
      setPriceRange([minValue, maxValue]);
      console.log('Price range updated during drag:', [minValue, maxValue]);
      
    } catch (error) {
      console.error('Error updating price range:', error);
    }
  };

  // Handler for when the user clicks "Apply Price Range" button
  const handleApplyPriceRange = () => {
    console.log('Manually applying price range:', priceRange);
    
    // Temporarily set dragging to false to allow the update
    isDraggingRef.current = false;
    
    // Validate price range values
    const validMinPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, priceRange[0]));
    const validMaxPrice = Math.max(validMinPrice, Math.min(MAX_PRICE, priceRange[1]));
    
    // Only update if values are different from current active filters
    if (validMinPrice !== activeFilters.minPrice || validMaxPrice !== activeFilters.maxPrice) {
      updateFilters({ 
        minPrice: validMinPrice === MIN_PRICE ? null : validMinPrice,
        maxPrice: validMaxPrice === MAX_PRICE ? null : validMaxPrice,
        page: 1 // Reset to page 1 when changing price range
      });
    } else {
      console.log('Price range unchanged, not updating filters');
    }
  };
  
  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return `$${price}`;
  };
  
  // Handler for sort change
  const handleSortChange = (sortOption: string) => {
    updateFilters({ 
      sort: sortOption === 'newest' ? null : sortOption,
      page: 1 // Reset to page 1 when changing sort
    });
  };
  
  // Handler for reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    // Reset price range slider state
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    updateFilters({
      category: null,
      sort: null,
      page: 1,
      minPrice: null,
      maxPrice: null,
      search: null
    });
  };
  
  // Get page title based on filters
  const getPageTitle = () => {
    // If we have a search query, prioritize it in the title
    if (activeFilters.search) {
      const categoryName = activeFilters.category !== 'all' 
        ? ` in ${getCategoryName(activeFilters.category)}` 
        : '';
      return `Search Results: "${activeFilters.search}"${categoryName}`;
    }
    
    // Otherwise show category
    if (activeFilters.category !== 'all') {
      return getCategoryName(activeFilters.category);
    }
    
    // Default title
    return 'All Products';
  };
  
  // Add a useEffect to log when products or pagination info changes
  useEffect(() => {
    console.log('Products or pagination updated:', {
      productsCount: products.length,
      totalProducts,
      totalPages,
      currentPage: activeFilters.page,
      apiTotalVsDisplayed: `API reports ${totalProducts} total products, showing ${products.length} on current page`
    });
    
    // Check if we need to handle empty results for page > 1
    if (products.length === 0 && activeFilters.page > 1 && totalProducts > 0) {
      console.warn('Empty results on page > 1. Redirecting to page 1');
      updateFilters({ page: 1 });
    }
  }, [products.length, totalProducts, totalPages, activeFilters.page, updateFilters]);
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
                
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile filter button */}
          <div className="md:hidden mb-4">
            <Button 
              className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all shadow-md"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
              <span className="ml-1 text-xs bg-white/20 rounded-full px-2 py-0.5">
                {Object.keys(activeFilters).filter(key => 
                  (key === 'category' && activeFilters[key] !== 'all') || 
                  (key === 'minPrice' && activeFilters[key] > 0) ||
                  (key === 'maxPrice' && activeFilters[key] < 1000) ||
                  (key === 'search' && activeFilters[key]) ||
                  (key === 'sort' && activeFilters[key] !== 'newest')
                ).length || ''}
              </span>
            </Button>
          </div>
          
          {/* Enhanced Filters sidebar */}
          <div className={`w-full md:w-72 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow-md border border-gray-100 sticky top-24 overflow-hidden">
              {/* Filter header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
                <h2 className="text-xl font-semibold flex items-center">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                </h2>
                <p className="text-sm text-red-100 mt-1">Refine your search results</p>
              </div>
              
              {/* Search section */}
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold mb-3 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-red-600" />
                  Search Products
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery) {
                    updateFilters({ search: searchQuery });
                  }
                }}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery) {
                          e.preventDefault();
                          updateFilters({ search: searchQuery });
                        }
                      }}
                    />
                    <button 
                      type="submit"
                      className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Search products"
                    >
                      <Search className="h-full w-full" />
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Categories section */}
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold mb-3 flex items-center">
                  <svg className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Categories
                </h3>
                <div className="space-y-1">
                  {categories.map((cat: any) => (
                    <div 
                      key={cat.id} 
                      className={`rounded-md overflow-hidden transition-colors ${
                        activeFilters.category === cat.id ? 'bg-red-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => handleCategoryFilter(cat.id)}
                        className={`text-left w-full py-2 px-3 flex items-center justify-between ${
                          activeFilters.category === cat.id ? 'font-medium text-red-600' : 'text-gray-700'
                        }`}
                      >
                        <span className="flex items-center">
                          {activeFilters.category === cat.id && (
                            <svg className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {cat.name}
                        </span>
                        {cat.count > 0 && cat.id !== 'all' && (
                          <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                            {cat.count}
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Range section */}
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold mb-4 flex items-center">
                  <svg className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price Range
                </h3>
                <div className="px-2">
                  <Slider
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={50}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    className="mb-6"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[80px] text-center">
                      {formatPrice(priceRange[0])}
                    </div>
                    <div className="text-sm text-gray-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 min-w-[80px] text-center">
                      {formatPrice(priceRange[1])}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center italic">
                    Products filter automatically as you slide
                  </div>
                </div>
              </div>
              
              {/* Reset button */}
              <div className="p-5">
                <Button 
                  variant="outline" 
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-center"
                  onClick={handleResetFilters}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset All Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {/* Enhanced header with title and sort */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {getPageTitle()}
                    </h1>
                    <div className="ml-3 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 max-w-xl">
                    Browse our selection of high-quality products. Use the filters on the left to narrow down your search results.
                  </p>
                </div>
                
                <div className="relative">
                  <label htmlFor="sort-options" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <svg className="h-4 w-4 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Sort by
                  </label>
                  <div className="relative">
                    <select
                      id="sort-options"
                      value={activeFilters.sort}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 min-w-[220px] font-medium text-gray-700 transition-all"
                      aria-label="Sort products by"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                  
                  {/* Hidden search form for small screens */}
                  <div className="lg:hidden mt-3">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery) updateFilters({ search: searchQuery });
                    }}>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                        />
                        <button 
                          type="submit"
                          className="absolute right-3 top-2 h-5 w-5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Search className="h-full w-full" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active filters display */}
            {(activeFilters.category !== 'all' || 
              activeFilters.minPrice > 0 || 
              activeFilters.maxPrice < 1000 || 
              activeFilters.search ||
              activeFilters.sort !== 'newest') && (
              <div className="flex flex-wrap gap-2 mb-5">
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
                    <button 
                      onClick={handleResetFilters}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium flex items-center"
                    >
                      Clear All
                      <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.category !== 'all' && (
                      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {getCategoryName(activeFilters.category)}
                        <button 
                          onClick={() => updateFilters({ category: null })}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {(activeFilters.minPrice > 0 || activeFilters.maxPrice < MAX_PRICE) && (
                      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatPrice(activeFilters.minPrice)} - {activeFilters.maxPrice === MAX_PRICE ? `${formatPrice(MAX_PRICE)}+` : formatPrice(activeFilters.maxPrice)}
                        <button 
                          onClick={() => updateFilters({ minPrice: null, maxPrice: null })}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {activeFilters.search && (
                      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {activeFilters.search}
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            updateFilters({ search: null });
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    {activeFilters.sort !== 'newest' && (
                      <div className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-md text-sm flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        {sortOptions.find(option => option.id === activeFilters.sort)?.name || activeFilters.sort}
                        <button 
                          onClick={() => updateFilters({ sort: null })}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <p>{error}</p>
              </div>
            )}
            
            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeFilters.search && (
                  <div className="col-span-full text-center mb-6">
                    <div className="inline-flex items-center bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-md">
                      <svg className="animate-spin h-4 w-4 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching for "<span className="font-medium">{activeFilters.search}</span>" {activeFilters.category !== 'all' ? `in ${getCategoryName(activeFilters.category)}` : ''}...
                    </div>
                  </div>
                )}
                {activeFilters.category !== 'all' && !activeFilters.search && (
                  <div className="col-span-full text-center mb-6">
                    <div className="inline-flex items-center bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-md">
                      <svg className="animate-spin h-4 w-4 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Showing <span className="font-medium">{getCategoryName(activeFilters.category)}</span> products...
                    </div>
                  </div>
                )}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100 relative">
                      <div className="absolute top-3 left-3">
                        <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-1/3 mb-3"></div>
                      <div className="flex items-center mb-3">
                        <div className="h-4 bg-gray-200 rounded-full w-24 mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded-full w-12"></div>
                      </div>
                      <div className="h-9 bg-gray-200 rounded-md w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div>
                {/* Grid layout options */}
                <div className="flex justify-end mb-4">
                  <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${
                        viewMode === 'grid' 
                          ? 'bg-red-50 text-red-600' 
                          : 'hover:bg-gray-50 text-gray-600'
                      } border-r border-gray-200 transition-colors`}
                      aria-label="Grid view"
                      aria-pressed={viewMode === 'grid'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${
                        viewMode === 'list' 
                          ? 'bg-red-50 text-red-600' 
                          : 'hover:bg-gray-50 text-gray-600'
                      } transition-colors`}
                      aria-label="List view"
                      aria-pressed={viewMode === 'list'}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Products in grid or list view */}
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col space-y-4"
                }>
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        discountedPrice: product.discountedPrice,
                        discountPercentage: product.discountPercentage,
                        rating: product.rating,
                        image: product.image || product.mediaUrl || '/images/placeholder.jpg',
                        description: product.description,
                      }}
                      priority={products.indexOf(product) < 6}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <NoProductsFound 
                isError={!!error}
                errorMessage={error}
                searchTerm={activeFilters.search}
                onReset={handleResetFilters}
              />
            )}
            
            {/* Enhanced Pagination */}
            {!loading && shouldShowPagination && (
              <div className="mt-10 mb-4">
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Showing <span className="font-medium">{((activeFilters.page - 1) * PRODUCTS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(activeFilters.page * PRODUCTS_PER_PAGE, totalProducts)}</span> of <span className="font-medium">{totalProducts}</span> products
                  </div>
                
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={activeFilters.page <= 1}
                      onClick={() => updateFilters({ page: activeFilters.page - 1 })}
                      className="px-3 py-2 mr-1 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    
                    <div className="hidden md:flex items-center border border-gray-200 rounded-md overflow-hidden">
                      {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                          <button
                            key={`page-${pageNum}`}
                            onClick={() => updateFilters({ page: pageNum })}
                            className={`min-w-[2.5rem] h-9 text-sm font-medium ${
                              pageNum === activeFilters.page 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      ))}
                    </div>
                    
                    <div className="md:hidden flex items-center px-3 py-1.5 border border-gray-200 rounded-md mx-1">
                      <span className="text-sm font-medium">
                        {activeFilters.page} / {totalPages}
                      </span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={activeFilters.page >= totalPages}
                      onClick={() => updateFilters({ page: activeFilters.page + 1 })}
                      className="px-3 py-2 ml-1 border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 