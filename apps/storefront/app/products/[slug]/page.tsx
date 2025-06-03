import axios from 'axios';
import { Metadata } from 'next';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  variants?: string[];
};

type Review = {
  rating: number;
  comment: string;
  user: { name: string };
};

type SEO = {
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd: string;
};

// Create a server-side API client
const serverApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
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
    
    // Fetch SEO data
    const { data }: { data: SEO } = await serverApi.get(`/seo/meta?slug=${slug}`);
    
    return {
      title: data.title,
      description: data.description,
      alternates: { canonical: data.canonicalUrl },
    };
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return { title: 'Product Details', description: 'Explore product details and pricing' };
  }
}

export default async function ProductPage({ params }: PageParams) {
  let product: Product;
  let reviews: Review[];
  let seo: SEO;

  try {
    // Extract slug safely
    const slug = await extractSlug(params);
    
    // Fetch all data in parallel
    const [productRes, reviewsRes, seoRes] = await Promise.all([
      serverApi.get(`/products/${slug}`),
      serverApi.get(`/reviews/${slug}`),
      serverApi.get(`/seo/meta?slug=${slug}`),
    ]);
    
    product = productRes.data.product;
    reviews = reviewsRes.data.reviews;
    seo = seoRes.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Provide fallback data in case of error
    product = {
      id: '',
      name: 'Product Not Found',
      slug: '',
      description: 'This product could not be loaded.',
      price: 0,
      image: 'https://via.placeholder.com/400x300?text=Product+Not+Found',
    };
    reviews = [];
    seo = {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      canonicalUrl: '',
      jsonLd: '',
    };
  }

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{
      maxWidth: '64rem', // max-w-5xl
      margin: '0 auto',
      padding: '2rem 1rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2.5rem'
    }}>
      <div>
        <img 
          src={product.image} 
          alt={product.name} 
          style={{
            width: '100%',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: '600'
        }}>
          {product.name}
        </h1>
        
        <div style={{ 
          color: 'var(--text-color)',
          opacity: 0.7
        }}>
          ${product.price.toFixed(2)}
        </div>
        
        {avgRating && (
          <div style={{ 
            color: '#eab308',
            fontSize: '0.875rem'
          }}>
            ⭐ {avgRating} ({reviews.length} reviews)
          </div>
        )}
        
        <p style={{ 
          color: 'var(--text-color)',
          opacity: 0.8
        }}>
          {product.description}
        </p>

        <form 
          action="/api/cart/add" 
          method="POST" 
          style={{ 
            marginTop: '1rem',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input type="hidden" name="productId" value={product.id} />
          <button 
            type="submit" 
            style={{
              backgroundColor: 'var(--text-color)',
              color: 'var(--background-color)',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Add to Cart
          </button>
        </form>

        <form action="/api/wishlist/add" method="POST">
          <input type="hidden" name="productId" value={product.id} />
          <button 
            type="submit" 
            style={{
              fontSize: '0.875rem',
              textDecoration: 'underline',
              color: 'var(--text-color)',
              opacity: 0.7,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ♡ Add to Wishlist
          </button>
        </form>
      </div>

      <div style={{ 
        gridColumn: '1 / -1',
        marginTop: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem',
          fontWeight: '600'
        }}>
          Customer Reviews
        </h2>
        
        {reviews.length === 0 ? (
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-color)',
            opacity: 0.6
          }}>
            No reviews yet.
          </p>
        ) : (
          reviews.map((review, i) => (
            <div 
              key={i} 
              style={{
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              <div style={{ color: '#eab308', fontSize: '0.875rem' }}>
                ⭐ {review.rating}
              </div>
              <p style={{ 
                color: 'var(--text-color)',
                opacity: 0.8,
                fontSize: '0.875rem'
              }}>
                {review.comment}
              </p>
              <div style={{ 
                fontSize: '0.75rem',
                color: 'var(--text-color)',
                opacity: 0.5
              }}>
                – {review.user.name}
              </div>
            </div>
          ))
        )}
      </div>

      <script 
        type="application/ld+json" 
        suppressHydrationWarning 
        dangerouslySetInnerHTML={{ __html: seo.jsonLd }} 
      />
    </div>
  );
} 