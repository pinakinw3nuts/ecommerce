import { Metadata } from 'next';
import axios from 'axios';
import Image from 'next/image';
import { API_GATEWAY_URL } from '@/lib/constants';
import HeroSlider from '../components/sections/HeroSlider';
import CategoryIconsRow from '../components/sections/CategoryIconsRow';
import FeaturedCategories from '../components/sections/FeaturedCategories';
import BrandLogos from '../components/sections/BrandLogos';
import ProductCategories from '../components/sections/ProductCategories';
import FeaturedProducts from '@components/sections/FeaturedProducts';
import FlashSale from '../components/sections/FlashSale';
import AftermarketBrands from '../components/sections/AftermarketBrands';
import FeaturedBanners from '../components/sections/FeaturedBanners';
import TopReviews from '../components/sections/TopReviews';

type CMSBlock = {
  type: string;
  content: any;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
};

// Create a server-side API client with environment-aware configuration
const serverApi = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:3000/api' // For local development (using IPv4 explicitly)
    : API_GATEWAY_URL, // For Docker/production environment
  timeout: 5000, // Add timeout to prevent long waiting periods
});

// Add request interceptor for logging in development
if (process.env.NODE_ENV === 'development') {
  serverApi.interceptors.request.use(request => {
    console.log('API Request:', request.method, request.url);
    return request;
  });
}

export const metadata: Metadata = {
  title: 'Auto Parts Store – Premium OEM & Aftermarket Parts',
  description: 'Find the perfect parts for your vehicle. OEM and aftermarket auto parts with warranty and fast shipping.',
};

async function fetchCMS(): Promise<CMSBlock[]> {
  try {
    const { data } = await serverApi.get('/api/v1/widget/home');
    
    // Check if data exists and has the expected structure
    if (!data || !data.data) {
      console.log('CMS API returned unexpected data structure:', data);
      return [];
    }
    
    // Extract blocks from the response
    const homeContent = data.data;
    return homeContent.content?.blocks || [];
  } catch (error) {
    console.error('Error fetching CMS data:', error);
    return [];
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await serverApi.get('/v1/products/featured?limit=4');
    const data = response.data;
    
    // Check if data exists and has the expected structure
    if (!data || !data.products || !Array.isArray(data.products)) {
      console.log('Products API returned unexpected data structure:', data);
      return [];
    }
    
    return data.products.map((product: any) => ({
      id: product.id || '',
      name: product.name || 'Product',
      price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
      image: product.mediaUrl || '/images/placeholder.jpg',
      slug: product.slug || product.id || '',
      isFeatured: product.isFeatured === true,
      isOnSale: product.salePrice && parseFloat(product.salePrice) > 0,
      salePrice: product.salePrice ? parseFloat(product.salePrice) : undefined
    }));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function Home() {
  // Use Promise.allSettled to ensure the page renders even if one API fails
  const [cmsResult, productsResult] = await Promise.allSettled([
    fetchCMS(),
    fetchFeaturedProducts(),
  ]);
  
  const cmsBlocks = cmsResult.status === 'fulfilled' ? cmsResult.value : [];
  const featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];

  return (
    <main className="min-h-screen bg-gray-50">
      <HeroSlider />
      <CategoryIconsRow />
      <FeaturedCategories />
      <BrandLogos />
      <FeaturedProducts />
      <FlashSale />
      <ProductCategories />
      <AftermarketBrands />
      <FeaturedBanners />
      <TopReviews />
    </main>
  );
}
