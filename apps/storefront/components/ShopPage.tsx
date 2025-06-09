'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, Grid3X3, List, ChevronDown, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  category?: string;
  rating?: number;
  discountedPrice?: number;
  description?: string;
};

type Category = {
  id: string;
  name: string;
  count: number;
};

type PriceRange = {
  min: number;
  max: number;
};

// Items per page
const ITEMS_PER_PAGE = 6;

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Get search params
  const categoryParam = searchParams.get('category') || '';
  const minPriceParam = searchParams.get('minPrice') || '0';
  const maxPriceParam = searchParams.get('maxPrice') || '1000';
  const sortParam = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';
  const pageParam = searchParams.get('page') || '1';
  
  // Parse params
  const minPrice = parseInt(minPriceParam);
  const maxPrice = parseInt(maxPriceParam);
  const currentPage = parseInt(pageParam);
  
  // State for price range
  const [priceRange, setPriceRange] = useState<PriceRange>({ 
    min: isNaN(minPrice) ? 0 : minPrice, 
    max: isNaN(maxPrice) ? 1000 : maxPrice 
  });
  
  // Initialize search value from URL
  useEffect(() => {
    if (searchQuery) {
      setSearchValue(searchQuery);
    }
  }, [searchQuery]);
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/products');
        setProducts(data.products || []);
        setError('');
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/categories');
        
        if (data && Array.isArray(data.categories)) {
          const formattedCategories = data.categories.map((cat: any) => ({
            id: cat.id || cat._id || '',
            name: cat.name || '',
            count: cat.productCount || 0
          }));
          setCategories(formattedCategories);
        } else {
          console.error('Invalid category data format:', data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Filter and sort products
  useEffect(() => {
    if (!products.length) return;
    
    let result = [...products];
    
    // Filter by category
    if (categoryParam) {
      // In a real app, we would filter by actual category
      // For now, just simulate filtering by taking a subset
      const categoryIndex = categories.findIndex(c => c.id === categoryParam);
      if (categoryIndex >= 0) {
        // Take a different subset for each category
        const start = categoryIndex * 2;
        result = products.slice(start, start + 6);
      }
    }
    
    // Filter by price range
    result = result.filter(product => {
      const price = product.discountedPrice || product.price;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Sort products
    switch (sortParam) {
      case 'price-asc':
        result.sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
        break;
      case 'popular':
        // Sort by rating (if available)
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        // Keep the default order (newest first)
        break;
    }
    
    setFilteredProducts(result);
  }, [products, categoryParam, priceRange, searchQuery, sortParam, categories]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Update URL with filters
  const updateFilters = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    
    // Update search params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    
    // Reset to page 1 when filters change
    if (!('page' in params)) {
      url.searchParams.set('page', '1');
    }
    
    router.push(url.pathname + url.search);
  }, [router]);
  
  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchValue });
  };
  
  // Handle price filter
  const applyPriceFilter = () => {
    updateFilters({ 
      minPrice: priceRange.min.toString(), 
      maxPrice: priceRange.max.toString() 
    });
  };
  
  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: e.target.value });
  };
  
  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateFilters({ page: page.toString() });
  };
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-6 text-gray-500">
        <Link href="/" className="hover:text-[#D23F57]">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Products</span>
      </div>
      
      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border rounded-l-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[#D23F57]"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <Button 
            type="submit"
            className="bg-[#D23F57] hover:bg-[#b8354a] text-white rounded-l-none"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">
          {categoryParam 
            ? `${categories.find(c => c.id === categoryParam)?.name || 'Products'}`
            : searchQuery
              ? `Search results for "${searchQuery}"`
              : 'All Products'
          }
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Mobile filter button */}
          <Button 
            variant="outline" 
            className="md:hidden flex items-center"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {/* View toggle */}
          <div className="hidden md:flex items-center border rounded-md">
            <button 
              className={`p-2 ${view === 'grid' ? 'bg-gray-100' : ''}`}
              onClick={() => setView('grid')}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button 
              className={`p-2 ${view === 'list' ? 'bg-gray-100' : ''}`}
              onClick={() => setView('list')}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <select 
              className="appearance-none border rounded-md px-4 py-2 pr-8 bg-white"
              value={sortParam}
              onChange={handleSortChange}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products"
                  className={`flex items-center justify-between hover:text-[#D23F57] ${
                    !categoryParam ? 'text-[#D23F57] font-medium' : ''
                  }`}
                >
                  <span>All Products</span>
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/products?category=${category.id}`}
                    className={`flex items-center justify-between hover:text-[#D23F57] ${
                      categoryParam === category.id ? 'text-[#D23F57] font-medium' : ''
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">({category.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="border-t my-4"></div>
            
            <h2 className="font-semibold mb-4">Price Range</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-5/12">
                  <label className="text-xs text-gray-500 mb-1 block">Min</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-2 py-1"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  />
                </div>
                <div className="text-gray-400">-</div>
                <div className="w-5/12">
                  <label className="text-xs text-gray-500 mb-1 block">Max</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-2 py-1"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-[#D23F57] hover:bg-[#b8354a] text-white"
                onClick={applyPriceFilter}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile filters */}
        {filterOpen && (
          <div className="md:hidden bg-white rounded-lg border p-4 mb-4">
            <h2 className="font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products"
                  className={`flex items-center justify-between hover:text-[#D23F57] ${
                    !categoryParam ? 'text-[#D23F57] font-medium' : ''
                  }`}
                >
                  <span>All Products</span>
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link 
                    href={`/products?category=${category.id}`}
                    className={`flex items-center justify-between hover:text-[#D23F57] ${
                      categoryParam === category.id ? 'text-[#D23F57] font-medium' : ''
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">({category.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="border-t my-4"></div>
            
            <h2 className="font-semibold mb-4">Price Range</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-5/12">
                  <label className="text-xs text-gray-500 mb-1 block">Min</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-2 py-1"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  />
                </div>
                <div className="text-gray-400">-</div>
                <div className="w-5/12">
                  <label className="text-xs text-gray-500 mb-1 block">Max</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-2 py-1"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-[#D23F57] hover:bg-[#b8354a] text-white"
                onClick={applyPriceFilter}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
        
        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">No products found</h2>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button asChild>
                <Link href="/products">Clear Filters</Link>
              </Button>
            </div>
          ) : (
            <div className={view === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {currentProducts.map((product) => (
                view === 'grid' ? (
                  <Link 
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group border border-gray-200 rounded-lg p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-md mb-3">
                      <Image 
                        src={product.image || '/api/placeholder'} 
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {product.discountedPrice && (
                        <div className="absolute top-2 left-2 bg-[#D23F57] text-white text-xs font-medium px-2 py-1 rounded">
                          {Math.round((1 - product.discountedPrice / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium group-hover:text-[#D23F57] line-clamp-2">{product.name}</h3>
                    <div className="mt-1">
                      {product.discountedPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#D23F57]">${product.discountedPrice.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div 
                    key={product.id}
                    className="flex border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-md">
                      <Image 
                        src={product.image || '/api/placeholder'} 
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.discountedPrice && (
                        <div className="absolute top-2 left-2 bg-[#D23F57] text-white text-xs font-medium px-2 py-1 rounded">
                          {Math.round((1 - product.discountedPrice / product.price) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <Link href={`/products/${product.slug}`} className="hover:text-[#D23F57]">
                        <h3 className="font-medium">{product.name}</h3>
                      </Link>
                      <div className="mt-1">
                        {product.discountedPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#D23F57]">${product.discountedPrice.toFixed(2)}</span>
                            <span className="text-sm text-gray-500 line-through">${product.price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="font-semibold">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                        {product.description || "High-quality product with premium materials and exceptional craftsmanship."}
                      </p>
                      <div className="mt-4">
                        <Button asChild className="bg-[#D23F57] hover:bg-[#b8354a] text-white">
                          <Link href={`/products/${product.slug}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                {/* First page */}
                {currentPage > 2 && (
                  <Button 
                    variant="outline"
                    className={currentPage === 1 ? "bg-[#D23F57] text-white border-[#D23F57]" : ""}
                    onClick={() => goToPage(1)}
                  >
                    1
                  </Button>
                )}
                
                {/* Ellipsis */}
                {currentPage > 3 && (
                  <span className="px-2">...</span>
                )}
                
                {/* Previous page */}
                {currentPage > 1 && (
                  <Button 
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    {currentPage - 1}
                  </Button>
                )}
                
                {/* Current page */}
                <Button 
                  variant="outline" 
                  className="bg-[#D23F57] text-white border-[#D23F57]"
                >
                  {currentPage}
                </Button>
                
                {/* Next page */}
                {currentPage < totalPages && (
                  <Button 
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    {currentPage + 1}
                  </Button>
                )}
                
                {/* Ellipsis */}
                {currentPage < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                
                {/* Last page */}
                {currentPage < totalPages - 1 && totalPages > 1 && (
                  <Button 
                    variant="outline"
                    onClick={() => goToPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          
          {/* Results count */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 