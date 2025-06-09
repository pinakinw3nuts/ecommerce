import axios from 'axios';
import { Metadata } from 'next';
import { Product, RelatedProduct, SEO } from '@/lib/types';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { API_GATEWAY_URL } from '@/lib/constants';

// Create a server-side API client with explicit IPv4 address
const serverApi = axios.create({
  baseURL: API_GATEWAY_URL,
});

// Mock data for when API fails or is not available
const mockProduct: Product = {
  id: 'sample-id',
  name: 'Premium Cotton T-Shirt',
  slug: 'premium-cotton-t-shirt',
  description: 'High-quality cotton t-shirt with a comfortable fit. Perfect for everyday wear and special occasions.',
  price: 39.99,
  discountedPrice: 29.99,
  rating: 4.5,
  reviewCount: 127,
  images: [
    '/api/placeholder',
    '/api/placeholder',
    '/api/placeholder',
    '/api/placeholder',
  ],
  colors: ['Black', 'White', 'Navy', 'Gray'],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

const mockRelatedProducts: RelatedProduct[] = [
  {
    id: '2',
    title: 'Slim Fit Jeans',
    price: '$49.99',
    imageUrl: '/api/placeholder',
    productId: 'slim-fit-jeans',
    rating: 4.2,
  },
  {
    id: '3',
    title: 'Classic Oxford Shirt',
    price: '$39.99',
    imageUrl: '/api/placeholder',
    productId: 'classic-oxford-shirt',
    rating: 4.0,
  },
  {
    id: '4',
    title: 'Leather Sneakers',
    price: '$89.99',
    imageUrl: '/api/placeholder',
    productId: 'leather-sneakers',
    rating: 4.7,
  },
  {
    id: '5',
    title: 'Wool Blend Sweater',
    price: '$59.99',
    imageUrl: '/api/placeholder',
    productId: 'wool-blend-sweater',
    rating: 4.3,
  },
];

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
  let product: Product;
  let relatedProducts: RelatedProduct[];
  let seo: SEO;

  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    try {
      // Fetch all data in parallel
      const [productRes, relatedProductsRes, seoRes] = await Promise.all([
        serverApi.get(`/products/${slug}`),
        serverApi.get(`/products/related/${slug}`),
        serverApi.get(`/seo/meta?slug=${slug}`),
      ]);
      
      product = productRes.data.product;
      relatedProducts = relatedProductsRes.data.relatedProducts;
      seo = seoRes.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Use mock data when API fails
      // Customize mock product based on the slug
      product = {
        ...mockProduct,
        slug,
        name: slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
      };
      
      relatedProducts = mockRelatedProducts;
      
      seo = {
        title: `${product.name} | Shopfinity`,
        description: `Explore our premium ${product.name}. ${product.description}`,
        canonicalUrl: `/products/${slug}`,
        jsonLd: '',
      };
    }
  } catch (error) {
    console.error('Error in ProductPage:', error);
    
    // Fallback to mock data if everything fails
    product = mockProduct;
    relatedProducts = mockRelatedProducts;
    seo = {
      title: 'Product Details',
      description: 'Explore product details and pricing',
      canonicalUrl: '',
      jsonLd: '',
    };
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
      price: product.discountedPrice,
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
      
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
} 