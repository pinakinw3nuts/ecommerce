'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { ProductCard } from '@/components/shop/ProductCard';

// Categories for filtering
const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home', name: 'Home & Kitchen' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'beauty', name: 'Beauty' },
];

// Sort options
const sortOptions = [
  { id: 'newest', name: 'Newest' },
  { id: 'price-asc', name: 'Price: Low to High' },
  { id: 'price-desc', name: 'Price: High to Low' },
  { id: 'popular', name: 'Popularity' },
];

// Min and max price range
const MIN_PRICE = 0;
const MAX_PRICE = 1000;

export default function ShopPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
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
  
  // Debug log to check what comes from URL parameters
  console.log('URL Parameters:', {
    category,
    search,
    sort,
    page,
    minPrice,
    maxPrice
  });
  
  // State for products and loading
  const [products, setProducts] = useState<any[]>([]);
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
    typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) || MIN_PRICE : MIN_PRICE,
    typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) || MAX_PRICE : MAX_PRICE
  ]);
  
  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // Debounce price range changes to avoid too many updates
  const debouncedPriceRange = useDebounce(priceRange, 500);
  
  // Products per page
  const PRODUCTS_PER_PAGE = 12;
  
  // For debugging - log initial params
  useEffect(() => {
    console.log('Initial search params:', {
      category,
      search,
      sort,
      page,
      minPrice,
      maxPrice
    });
  }, []);
  
  // Debug the initial state
  useEffect(() => {
    console.log('Initial activeFilters state:', activeFilters);
  }, []);
  
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
      
      console.log('Direct URL parameters:', {
        category: urlCategory,
        search: urlSearch,
        sort: urlSort,
        page: urlPage,
        minPrice: urlMinPrice,
        maxPrice: urlMaxPrice
      });
      
      // Update state directly from URL
      if (urlSearch !== '' || urlCategory !== 'all') {
        setActiveFilters(prev => ({
          ...prev,
          category: urlCategory,
          search: urlSearch,
          sort: urlSort,
          page: urlPage,
          minPrice: urlMinPrice,
          maxPrice: urlMaxPrice
        }));
        
        // Also update search query for the input field
        if (urlSearch) {
          setSearchQuery(urlSearch);
        }
        
        // Update price range slider
        setPriceRange([urlMinPrice, urlMaxPrice]);
      }
    }
  }, []);
  
  // Initialize state when search params change (like from header search)
  useEffect(() => {
    if (search !== searchQuery) {
      setSearchQuery(search);
    }
    
    // Reset price range slider when URL params change
    setPriceRange([
      typeof searchParams.minPrice === 'string' ? parseInt(searchParams.minPrice) || MIN_PRICE : MIN_PRICE,
      typeof searchParams.maxPrice === 'string' ? parseInt(searchParams.maxPrice) || MAX_PRICE : MAX_PRICE
    ]);
    
    // Update active filters when search params change externally
    setActiveFilters(prev => {
      const newFilters = {
        ...prev,
        category,
        sort,
        page,
        minPrice,
        maxPrice,
        search
      };
      
      console.log('URL params changed, updating filters from:', prev, 'to:', newFilters);
      return newFilters;
    });
    
  }, [search, category, sort, page, minPrice, maxPrice]);
  
  // Update URL with filters
  const updateFilters = (newParams: Record<string, string | number | null>) => {
    // Create a new URLSearchParams object based on current searchParams
    const params = new URLSearchParams();
    
    // Start with current active filters
    if (activeFilters.category !== 'all') params.set('category', activeFilters.category);
    if (activeFilters.sort !== 'newest') params.set('sort', activeFilters.sort);
    if (activeFilters.page !== 1) params.set('page', activeFilters.page.toString());
    if (activeFilters.minPrice > 0) params.set('minPrice', activeFilters.minPrice.toString());
    if (activeFilters.maxPrice < 1000) params.set('maxPrice', activeFilters.maxPrice.toString());
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
               key === 'minPrice' ? 0 : 
               key === 'maxPrice' ? 1000 : 
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
  };
  
  // Fetch products based on filters
  useEffect(() => {
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
        console.log('Active filters:', {
          category: activeFilters.category,
          search: activeFilters.search,
          sort: activeFilters.sort,
          page: activeFilters.page,
          minPrice: activeFilters.minPrice,
          maxPrice: activeFilters.maxPrice
        });
        
        const response = await fetch(apiUrl.toString());
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.products) {
          throw new Error('Invalid response format from API');
        }
        
        console.log('Products fetched:', data.products.length, 'of total:', data.total);
        if (data.filterSummary) {
          console.log('Filter summary:', data.filterSummary);
        }
        
        setProducts(data.products);
        setTotalProducts(data.total || 0);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
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
  
  // Update price filter when debounced price range changes
  useEffect(() => {
    // Only update if the values have actually changed
    if (debouncedPriceRange[0] !== activeFilters.minPrice || 
        debouncedPriceRange[1] !== activeFilters.maxPrice) {
      updateFilters({ 
        minPrice: debouncedPriceRange[0], 
        maxPrice: debouncedPriceRange[1],
        page: 1 // Reset to page 1 when changing price
      });
    }
  }, [debouncedPriceRange]);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of visible pages
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      
      // Adjust if at the beginning or end
      if (page <= 2) {
        end = 4;
      } else if (page >= totalPages - 1) {
        start = totalPages - 3;
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
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };
  
  // Find the matching category display name
  const getCategoryName = (categoryId: string) => {
    const normalizedId = categoryId.toLowerCase();
    
    // Map common variations to standard category IDs
    const categoryMap: Record<string, string> = {
      'home & garden': 'home',
      'fashion': 'clothing'
    };
    
    const mappedId = categoryMap[normalizedId] || normalizedId;
    
    // Find the category with the mapped ID
    const category = categories.find(c => c.id.toLowerCase() === mappedId);
    return category ? category.name : categoryId;
  };
  
  // Handler for category filter
  const handleCategoryFilter = (categoryId: string) => {
    console.log(`Category selected: ${categoryId}`);
    
    // Clear search query when changing category
    setSearchQuery('');
    
    // Update URL and state in one call
    updateFilters({
      category: categoryId === 'all' ? null : categoryId,
      search: null,
      page: 1
    });
    
    // Log what's happening
    console.log(`Category filter applied: ${categoryId}`);
  };
  
  // Handler for price slider change
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
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
    updateFilters({
      category: null,
      sort: null,
      page: null,
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
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile filter button */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {mobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          {/* Filters sidebar */}
          <div className={`w-full md:w-64 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-lg shadow p-5 sticky top-24">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center">
                      <button
                        onClick={() => handleCategoryFilter(cat.id)}
                        className={`text-left w-full py-1 ${
                          activeFilters.category === cat.id ? 'font-medium text-primary' : 'text-gray-700'
                        }`}
                      >
                        {cat.name}
                        {activeFilters.category === cat.id && (
                          <span className="ml-2 text-xs text-primary">✓</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Price Range</h3>
                <div className="px-2">
                  <Slider
                    defaultValue={priceRange}
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    className="mb-6"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="bg-gray-100 rounded px-2 py-1 text-sm">
                      {formatPrice(priceRange[0])}
                    </div>
                    <div className="text-sm text-gray-500">to</div>
                    <div className="bg-gray-100 rounded px-2 py-1 text-sm">
                      {formatPrice(priceRange[1])}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {/* Sort and results count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {getPageTitle()}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                </p>
              </div>
              
              <div className="relative">
                <select
                  value={activeFilters.sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none border border-gray-300 rounded-md py-2 pl-3 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      Sort by: {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Active filters display */}
            {(activeFilters.category !== 'all' || 
              activeFilters.minPrice > 0 || 
              activeFilters.maxPrice < 1000 || 
              activeFilters.search) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.category !== 'all' && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center">
                    Category: {getCategoryName(activeFilters.category)}
                    <button 
                      onClick={() => updateFilters({ category: null })}
                      className="ml-2 text-primary hover:text-primary/70"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {(activeFilters.minPrice > 0 || activeFilters.maxPrice < 1000) && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center">
                    Price: ${activeFilters.minPrice} - ${activeFilters.maxPrice === 1000 ? '1000+' : activeFilters.maxPrice}
                    <button 
                      onClick={() => updateFilters({ minPrice: null, maxPrice: null })}
                      className="ml-2 text-primary hover:text-primary/70"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {activeFilters.search && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center">
                    Search: {activeFilters.search}
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        updateFilters({ search: null });
                      }}
                      className="ml-2 text-primary hover:text-primary/70"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-primary underline"
                >
                  Clear all filters
                </button>
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
                    <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-md">
                      Searching for "{activeFilters.search}" {activeFilters.category !== 'all' ? `in ${getCategoryName(activeFilters.category)}` : ''}...
                    </div>
                  </div>
                )}
                {activeFilters.category === 'electronics' && !activeFilters.search && (
                  <div className="col-span-full text-center mb-6">
                    <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-md">
                      Showing Electronics category products...
                    </div>
                  </div>
                )}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    priority={products.indexOf(product) < 6}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleResetFilters}>
                    Reset All Filters
                  </Button>
                  {activeFilters.category === 'electronics' && (
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = "/products?category=electronics"}
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      Retry Electronics Category
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={activeFilters.page === 1}
                    onClick={() => updateFilters({ page: activeFilters.page - 1 })}
                    className="px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-2">...</span>
                    ) : (
                      <Button
                        key={`page-${pageNum}`}
                        variant={pageNum === activeFilters.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilters({ page: pageNum })}
                        className="min-w-[2.5rem]"
                      >
                        {pageNum}
                      </Button>
                    )
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={activeFilters.page === totalPages}
                    onClick={() => updateFilters({ page: activeFilters.page + 1 })}
                    className="px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 