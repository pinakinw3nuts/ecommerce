import { Metadata } from 'next';
import axios from 'axios';
import Image from 'next/image';
import HeroSection from '@components/home/Hero';
import CategoryHighlights from '@components/home/CategoryHighlights';
import ProductGrid from '@components/home/ProductGrid';
import DealsBanner from '@components/home/DealsBanner';
import NewsletterSignup from '@components/home/NewsletterSignup';
import Testimonials from '@components/sections/Testimonials';
import PromoBanner from '@components/sections/PromoBanner';
import FeaturedCategories from '../components/sections/FeaturedCategories';
import { API_GATEWAY_URL } from '@/lib/constants';

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

// Create a server-side API client with explicit IPv4 address
const serverApi = axios.create({
  baseURL: API_GATEWAY_URL,
});

export const metadata: Metadata = {
  title: 'MyStore – Modern Fashion E-commerce',
  description: 'Discover the latest trends in fashion with our exclusive collection.',
};

async function fetchCMS(): Promise<CMSBlock[]> {
  try {
    const { data } = await serverApi.get('/v1/widget/home');
    
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

export default async function HomePage() {
  // Use Promise.allSettled to ensure the page renders even if one API fails
  const [cmsResult, productsResult] = await Promise.allSettled([
    fetchCMS(),
    fetchFeaturedProducts(),
  ]);
  
  const cmsBlocks = cmsResult.status === 'fulfilled' ? cmsResult.value : [];
  const featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];

  return (
    <>
      <HeroSection />
      <CategoryHighlights />
      <ProductGrid />
      <DealsBanner />
      <PromoBanner />
      <Testimonials />
      <FeaturedCategories />
      
      <div className="max-w-[1440px] mx-auto px-4 py-12">
        {cmsBlocks.map((block, idx) => {
          if (block.type === 'banner') {
            return (
              <div key={idx} className="w-full overflow-hidden rounded-md shadow-sm mb-12">
                <div className="relative w-full h-64">
                  <Image 
                    src={block.content.imageUrl || '/api/placeholder'} 
                    alt={block.content.alt || 'Banner image'} 
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            );
          }
          if (block.type === 'text') {
            return (
              <div key={idx} className="text-center text-lg text-gray-600 mb-12">
                {block.content.text}
              </div>
            );
          }
          return null;
        })}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <a 
                key={product.id} 
                href={`/products/${product.slug}`} 
                className="group border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-md mb-3">
                  <Image 
                    src={product.image || '/images/placeholder.jpg'} 
                    alt={product.name} 
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {product.isOnSale && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      SALE
                    </div>
                  )}
                </div>
                <h3 className="font-medium">{product.name}</h3>
                <div className="flex items-center">
                  {product.isOnSale && product.salePrice !== undefined ? (
                    <>
                      <p className="text-gray-600 line-through mr-2">${product.price.toFixed(2)}</p>
                      <p className="text-red-500 font-semibold">${product.salePrice.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="text-gray-600">${product.price.toFixed(2)}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
      
      <NewsletterSignup />
    </>
  );
}
