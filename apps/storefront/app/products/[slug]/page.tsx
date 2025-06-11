import axios from 'axios';
import { Metadata } from 'next';
import { Product, RelatedProduct, SEO, Review } from '@/lib/types';
import ProductDetailClient from '@/components/products/ProductDetailClient';
import { API_GATEWAY_URL } from '@/lib/constants';
import { notFound } from 'next/navigation';

// Create a server-side API client with environment-aware configuration
const serverApi = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:3003/api' // Updated to use port 3003 to match the working URL
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
      const { data }: { data: SEO } = await serverApi.get(`/v1/seo/meta?slug=${slug}`);
      
      return {
        title: data.title,
        description: data.description,
        alternates: { canonical: data.canonicalUrl },
        openGraph: {
          title: data.title,
          description: data.description,
          url: data.canonicalUrl,
          type: 'website',
          images: [
            {
              url: `/api/og?title=${encodeURIComponent(data.title)}`,
              width: 1200,
              height: 630,
              alt: data.title
            }
          ]
        },
        twitter: {
          card: 'summary_large_image',
          title: data.title,
          description: data.description,
        }
      };
    } catch (error) {
      // Fallback to generating metadata from slug
      const formattedTitle = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return { 
        title: `${formattedTitle} | Shopfinity`, 
        description: `Explore our ${formattedTitle} and more quality products at Shopfinity.`,
        openGraph: {
          title: `${formattedTitle} | Shopfinity`,
          description: `Explore our ${formattedTitle} and more quality products at Shopfinity.`,
          type: 'website',
        }
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
      // Fetch all data in parallel using the correct endpoint URL format
      const [productResponse, relatedProductsResponse, reviewsResponse] = await Promise.allSettled([
        serverApi.get(`/v1/products/slug/${slug}`), // Using the confirmed working URL format
        serverApi.get(`/v1/products/related/${slug}?limit=4`),
        serverApi.get(`/v1/reviews/product-slug/${slug}?limit=5&sort=newest`),
      ]);
      
      // Handle product data - this is required
      if (productResponse.status !== 'fulfilled') {
        console.error('Error fetching product:', productResponse.reason);
        notFound();
      }
      
      // Extract product data
      const productData = productResponse.value.data;
      
      // Convert the API response format to match our Product type
      const product: Product = {
        id: productData.id || '',
        name: productData.name || '',
        slug: productData.slug || '',
        description: productData.description || '',
        price: productData.price || 0,
        discountedPrice: productData.salePrice && productData.salePrice > 0 ? productData.salePrice : 0,
        rating: 0, // Will be updated if reviews are available
        reviewCount: 0, // Will be updated if reviews are available
        // Handle the case where images array doesn't exist but mediaUrl does
        images: productData.images || (productData.mediaUrl ? [productData.mediaUrl] : []),
        colors: [], // Not provided in the API response
        sizes: [], // Not provided in the API response
        categories: productData.category ? [productData.category.name] : [],
        tags: productData.tags ? productData.tags.map((tag: any) => tag.name) : [],
        inStock: productData.isInStock !== undefined ? productData.isInStock : true,
        stockQuantity: productData.stockQuantity || 0,
        specifications: typeof productData.specifications === 'string' && productData.specifications
          ? JSON.parse(productData.specifications)
          : productData.specifications || {}
      };
      
      // Extract related products (optional)
      let relatedProducts: RelatedProduct[] = [];
      if (relatedProductsResponse.status === 'fulfilled') {
        relatedProducts = relatedProductsResponse.value.data.relatedProducts || 
                         relatedProductsResponse.value.data || 
                         [];
      }
      
      // Extract reviews and update product rating data (optional)
      let reviews: Review[] = [];
      if (reviewsResponse.status === 'fulfilled' && 
          reviewsResponse.value.data && 
          reviewsResponse.value.data.reviews) {
        reviews = reviewsResponse.value.data.reviews;
        
        // Update product rating and review count based on actual reviews
        if (reviewsResponse.value.data.productRating) {
          product.rating = reviewsResponse.value.data.productRating.averageRating || product.rating;
          product.reviewCount = reviewsResponse.value.data.productRating.totalReviews || product.reviewCount;
        }
      }

      // Ensure we have at least basic product data
      if (!product.name || !product.id) {
        console.error('Invalid product data received', product);
        notFound();
      }

      // Add structured data for SEO - comprehensive Schema.org markup
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        // Safely handle image data
        image: product.images && product.images.length > 0 
          ? product.images.map(img => img) 
          : ['/images/placeholder-product.jpg'],
        sku: product.id,
        mpn: product.id,
        brand: {
          '@type': 'Brand',
          name: productData.brand?.name || 'Shopfinity'
        },
        offers: {
          '@type': 'Offer',
          url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/products/${product.slug}`,
          price: product.discountedPrice > 0 ? product.discountedPrice : product.price,
          priceCurrency: 'USD',
          availability: product.inStock === false 
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        ...(product.rating && product.reviewCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1
          }
        } : {}),
        ...(reviews.length > 0 ? {
          review: reviews.map(review => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1
            },
            author: {
              '@type': 'Person',
              name: review.user.name
            },
            datePublished: new Date(review.createdAt).toISOString().split('T')[0],
            reviewBody: review.comment
          }))
        } : {})
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