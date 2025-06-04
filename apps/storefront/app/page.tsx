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
};

// Create a server-side API client
const serverApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
});

export const metadata: Metadata = {
  title: 'MyStore – Modern Fashion E-commerce',
  description: 'Discover the latest trends in fashion with our exclusive collection.',
};

async function fetchCMS(): Promise<CMSBlock[]> {
  try {
    const { data } = await serverApi.get('/cms/home');
    return data.blocks || [];
  } catch (error) {
    console.error('Error fetching CMS data:', error);
    return [];
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const { data } = await serverApi.get('/products?featured=true&limit=4');
    if (!data || !data.products) {
      console.log('Products API returned unexpected data structure:', data);
      return [];
    }
    return data.products;
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
                    src={product.image || '/api/placeholder'} 
                    alt={product.name} 
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">${product.price.toFixed(2)}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
      
      <NewsletterSignup />
    </>
  );
}
