import { Metadata } from 'next';
import axios from 'axios';
import Hero from '@components/home/Hero';
import Features from '@components/home/Features';
import Testimonials from '../components/sections/Testimonials';
import ProductHighlights from '@components/home/ProductHighlights';
import NewsletterSignup from '@components/home/NewsletterSignup';
import Footer from '../components/layout/Footer';
import FeaturedCategories from '../components/sections/FeaturedCategories';
import PromoBanner from '../components/sections/PromoBanner';

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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await serverApi.get('/seo/meta?slug=home');
    return {
      title: data.title,
      description: data.description,
      alternates: { canonical: data.canonicalUrl },
      openGraph: {
        title: data.title,
        description: data.description,
        url: data.canonicalUrl,
      },
    };
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return {
      title: 'MyStore – Home',
      description: 'Welcome to MyStore!',
    };
  }
}

async function fetchCMS(): Promise<CMSBlock[]> {
  try {
    const { data } = await serverApi.get('/cms/home');
    return data.blocks;
  } catch (error) {
    console.error('Error fetching CMS data:', error);
    return [];
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    const { data } = await serverApi.get('/products?featured=true&limit=4');
    return data.products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function HomePage() {
  const [cmsBlocks, featuredProducts] = await Promise.all([
    fetchCMS(),
    fetchFeaturedProducts(),
  ]);

  return (
    <>
      <Hero />
      <Features />
      <PromoBanner />
      <Testimonials />
      <ProductHighlights />
      <FeaturedCategories />
      
      <div className="max-w-[1440px] mx-auto px-4 py-12">
        {cmsBlocks.map((block, idx) => {
          if (block.type === 'banner') {
            return (
              <div key={idx} className="w-full overflow-hidden rounded-md shadow-sm mb-12">
                <img 
                  src={block.content.imageUrl} 
                  alt={block.content.alt} 
                  className="w-full h-auto"
                />
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
                <div className="aspect-square overflow-hidden rounded-md mb-3">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">${product.price}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
      
      <NewsletterSignup />
      <Footer />
    </>
  );
}
