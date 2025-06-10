import axios from 'axios';
import { Metadata } from 'next';
import { Product, RelatedProduct, SEO, Review } from '@/lib/types';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { API_GATEWAY_URL } from '@/lib/constants';
import { notFound } from 'next/navigation';

// Create a server-side API client with environment-aware configuration
const serverApi = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api' // For local development
    : API_GATEWAY_URL, // For Docker/production environment
  timeout: 5000, // Add timeout to prevent long waiting periods
});

// Define the params type for Next.js 14 dynamic routes
type PageParams = {
  params: {
    slug: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
};

// Helper function to extract slug safely
async function extractSlug(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.slug || '';
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Try to fetch SEO data
    try {
      const { data }: { data: SEO } = await serverApi.get(`/seo/meta?slug=${slug}`);
      
      return {
        title: data.title,
        description: data.description,
        alternates: { canonical: data.canonicalUrl },
      };
    } catch (error) {
      // Fallback to generating metadata from slug
      const formattedTitle = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return { 
        title: `${formattedTitle} | Shopfinity`, 
        description: `Explore our ${formattedTitle} and more quality products at Shopfinity.` 
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return { title: 'Product Details', description: 'Explore product details and pricing' };
  }
}

export default async function ProductPage({ params }: PageParams) {
  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    try {
      // Fetch all data in parallel
      const [productResponse, relatedProductsResponse, reviewsResponse] = await Promise.all([
        serverApi.get(`/products/${slug}`),
        serverApi.get(`/products/related/${slug}?limit=4`),
        serverApi.get(`/reviews/product-slug/${slug}?limit=5&sort=newest`),
      ]);
      
      // Extract product data
      const product: Product = productResponse.data;
      
      // Extract related products
      const relatedProducts: RelatedProduct[] = 
        relatedProductsResponse.data.relatedProducts || 
        relatedProductsResponse.data || 
        [];
      
      // Extract reviews and update product rating data
      let reviews: Review[] = [];
      if (reviewsResponse.data && reviewsResponse.data.reviews) {
        reviews = reviewsResponse.data.reviews;
        
        // Update product rating and review count based on actual reviews
        if (reviewsResponse.data.productRating) {
          product.rating = reviewsResponse.data.productRating.averageRating || product.rating;
          product.reviewCount = reviewsResponse.data.productRating.totalReviews || product.reviewCount;
        }
      }

      // Add structured data for SEO
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images[0],
        offers: {
          '@type': 'Offer',
          price: product.discountedPrice || product.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
      };

      return (
        <>
          {/* Add JSON-LD structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          
          <ProductDetailClient 
            product={product} 
            relatedProducts={relatedProducts} 
            reviews={reviews}
          />
        </>
      );
    } catch (error) {
      console.error('Error fetching product data:', error);
      notFound(); // Use Next.js notFound() to show 404 page
    }
  } catch (error) {
    console.error('Error in ProductPage:', error);
    notFound(); // Use Next.js notFound() to show 404 page
  }
} 