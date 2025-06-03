import { Metadata } from 'next';
import axios from 'axios';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  price: number;
  slug: string;
  image: string;
  rating?: number;
};

export const metadata: Metadata = {
  title: 'All Products – MyStore',
  description: 'Browse all our products with filters and search.',
};

type Props = {
  searchParams?: {
    category?: string;
    sort?: string;
    page?: string;
  };
};

// Create a server-side API client
const serverApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
});

async function fetchProducts(params: Record<string, any>) {
  try {
    const { data } = await serverApi.get('/search', { params });
    return data; // assume data = { products: Product[], total: number }
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0 };
  }
}

export default async function ProductListingPage({ searchParams }: Props) {
  const page = Number(searchParams?.page || 1);
  const category = searchParams?.category || '';
  const sort = searchParams?.sort || '';

  const { products, total } = await fetchProducts({ category, sort, page, limit: 12 });

  const totalPages = Math.ceil(total / 12);

  return (
    <div style={{
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      padding: 'var(--spacing-6) var(--spacing-4)'
    }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem'
      }}>All Products</h1>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <span style={{
            fontSize: '0.875rem',
            color: 'var(--text-color)',
            opacity: 0.7
          }}>Total: {total} products</span>
        </div>
        <div>
          <form method="GET" style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              name="sort" 
              defaultValue={sort} 
              style={{
                border: '1px solid var(--border-color)',
                padding: '0.25rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Sort By</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating">Rating</option>
            </select>
            <button 
              type="submit" 
              style={{
                fontSize: '0.875rem',
                padding: '0 0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.25rem'
              }}
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {products.map((product: Product) => (
          <Link 
            key={product.id} 
            href={`/products/${product.slug}`} 
            style={{
              border: '1px solid var(--border-color)',
              padding: '1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'box-shadow 0.2s ease'
            }}
          >
            <img 
              src={product.image} 
              alt={product.name} 
              style={{
                width: '100%',
                height: '12rem',
                objectFit: 'cover',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem'
              }} 
            />
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>{product.name}</div>
            <div style={{
              color: 'var(--text-color)',
              opacity: 0.7
            }}>${product.price}</div>
            {product.rating && (
              <div style={{
                color: '#eab308',
                fontSize: '0.75rem'
              }}>⭐ {product.rating.toFixed(1)}</div>
            )}
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <Link
              key={i + 1}
              href={`?page=${i + 1}&category=${category}&sort=${sort}`}
              style={{
                padding: '0.25rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.25rem',
                textDecoration: 'none',
                backgroundColor: page === i + 1 ? 'var(--text-color)' : 'transparent',
                color: page === i + 1 ? 'var(--background-color)' : 'var(--text-color)'
              }}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 