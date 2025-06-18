'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, Grid3X3, List, ChevronDown, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ProductCard from '@/components/products/ProductCard';
import { useDebounce } from '@/hooks/useDebounce';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  category?: string;
  rating?: number;
  discountedPrice?: number;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface PriceRange {
  min: number;
  max: number;
}

// Constants
const ITEMS_PER_PAGE = 6;

// Loading component
function ShopPageLoading() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center text-sm mb-6 text-gray-500">
        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse"></div>
        <span className="mx-2">/</span>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="mb-6">
        <div className="flex">
          <div className="relative flex-1">
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-10 bg-gray-300 rounded animate-pulse ml-2"></div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-60">
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-lg overflow-hidden bg-white animate-pulse">
                <div className="h-40 bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/3 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Category Filter Component
function CategoryFilter({ 
  categories, 
  selectedCategory,
  onCategorySelect 
}: { 
  categories: Category[], 
  selectedCategory: string,
  onCategorySelect: (id: string) => void 
}) {
  return (
    <div className="mb-8">
      <h3 className="font-medium mb-3">Categories</h3>
      <div className="space-y-2">
        <button 
          onClick={() => onCategorySelect('')}
          className={`block w-full text-left py-1 px-2 rounded-md transition ${
            selectedCategory === '' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
          }`}
        >
          All Categories
        </button>
        
        {categories.map(category => (
          <button 
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`block w-full text-left py-1 px-2 rounded-md transition ${
              selectedCategory === category.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            {category.name} <span className="text-gray-500 text-sm">({category.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Price Filter Component
function PriceFilter({
  priceRange,
  setPriceRange,
  onApplyPriceFilter
}: {
  priceRange: PriceRange,
  setPriceRange: (range: PriceRange) => void,
  onApplyPriceFilter: () => void
}) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setPriceRange({ ...priceRange, min: value });
    }
  };
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setPriceRange({ ...priceRange, max: value });
    }
  };
  
  return (
    <div className="mb-8">
      <h3 className="font-medium mb-3">Price Range</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span>$</span>
          <input 
            type="number" 
            min="0" 
            value={priceRange.min}
            onChange={handleMinChange}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Min"
          />
          <span>to</span>
          <span>$</span>
          <input 
            type="number" 
            min="0"
            value={priceRange.max}
            onChange={handleMaxChange}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Max"
          />
        </div>
        <Button 
          onClick={onApplyPriceFilter}
          className="w-full"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

// Sort and View Controls Component
function ShopControls({
  view,
  setView,
  sortOption,
  onSortChange,
  totalProducts
}: {
  view: 'grid' | 'list',
  setView: (view: 'grid' | 'list') => void,
  sortOption: string,
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
  totalProducts: number
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <p className="text-gray-500 text-sm">
        Showing <span className="font-medium text-gray-900">{totalProducts}</span> products
      </p>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <select 
            value={sortOption}
            onChange={onSortChange}
            className="border rounded-md py-2 pl-3 pr-8 appearance-none bg-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
        
        <button 
          onClick={() => setView('grid')}
          className={`p-2 rounded-md ${view === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => setView('list')}
          className={`p-2 rounded-md ${view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ProductGrid Component
function ProductGrid({ 
  products, 
  view 
}: { 
  products: Product[], 
  view: 'grid' | 'list' 
}) {
  if (products.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">No products found matching your criteria.</p>
      </div>
    );
  }
  
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mb-8">
      {products.map(product => (
        <div key={product.id} className="flex flex-col sm:flex-row border rounded-lg overflow-hidden bg-white">
          <div className="sm:w-1/3 relative aspect-square">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4 sm:w-2/3">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-gray-600 my-2 line-clamp-3">{product.description || 'No description available'}</p>
            <div className="mt-auto">
              <div className="flex items-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-yellow-400">
                    {i < (product.rating || 0) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
                <Link 
                  href={`/products/${product.slug}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main content component
function ShopPageContent() {
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
        }
      } catch (err) {
        // Handle error silently
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
      result = result.filter(product => product.category === categoryParam);
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
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        // Assuming newest is the default order
        break;
    }
    
    setFilteredProducts(result);
  }, [products, categoryParam, priceRange, searchQuery, sortParam]);
  
  // Update URL with filters
  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // Reset to page 1 when filters change
    if (Object.keys(updates).some(key => key !== 'page')) {
      params.set('page', '1');
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl);
  }, [searchParams, router]);
  
  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchValue || null });
  };
  
  // Apply price filter
  const applyPriceFilter = () => {
    updateUrlParams({ 
      minPrice: priceRange.min.toString(), 
      maxPrice: priceRange.max.toString() 
    });
  };
  
  // Sort change handler
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrlParams({ sort: e.target.value });
  };
  
  // Page change handler
  const goToPage = (page: number) => {
    updateUrlParams({ page: page.toString() });
  };
  
  // Category selection handler
  const handleCategorySelect = (categoryId: string) => {
    updateUrlParams({ category: categoryId || null });
  };
  
  // Calculate pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const currentPageProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm mb-6 text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Shop</span>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search products..."
              className="w-full border rounded-md py-2 pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Button type="submit" className="ml-2">Search</Button>
        </form>
      </div>
      
      {/* Mobile filter button */}
      <button
        className="md:hidden w-full mb-4 flex items-center justify-center gap-2 py-2 border rounded-md"
        onClick={() => setFilterOpen(!filterOpen)}
      >
        <Filter className="w-4 h-4" />
        {filterOpen ? 'Hide Filters' : 'Show Filters'}
      </button>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div className={`md:w-60 ${filterOpen ? 'block' : 'hidden md:block'}`}>
          <CategoryFilter 
            categories={categories} 
            selectedCategory={categoryParam}
            onCategorySelect={handleCategorySelect} 
          />
          
          <PriceFilter 
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            onApplyPriceFilter={applyPriceFilter}
          />
        </div>
        
        {/* Product grid */}
        <div className="flex-1">
          <ShopControls 
            view={view}
            setView={setView}
            sortOption={sortParam}
            onSortChange={handleSortChange}
            totalProducts={totalProducts}
          />
          
          <ProductGrid 
            products={currentPageProducts} 
            view={view} 
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShopPageContent />
    </div>
  );
} 