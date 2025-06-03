import { Metadata } from 'next';
import axios from 'axios';

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
    <div style={{
      maxWidth: 'var(--max-width)',
      margin: '0 auto',
      padding: 'var(--spacing-6) var(--spacing-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '3rem'
    }}>
      {cmsBlocks.map((block, idx) => {
        if (block.type === 'banner') {
          return (
            <div key={idx} style={{
              width: '100%',
              overflow: 'hidden',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
            }}>
              <img src={block.content.imageUrl} alt={block.content.alt} style={{
                width: '100%',
                height: 'auto'
              }} />
            </div>
          );
        }
        if (block.type === 'text') {
          return (
            <div key={idx} style={{
              textAlign: 'center',
              fontSize: '1.125rem',
              color: 'var(--text-color)',
              opacity: 0.7
            }}>
              {block.content.text}
            </div>
          );
        }
        return null;
      })}

      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          marginBottom: '1rem'
        }}>Featured Products</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {featuredProducts.map((product) => (
            <a key={product.id} href={`/products/${product.slug}`} style={{
              border: '1px solid var(--border-color)',
              padding: '1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'box-shadow 0.2s ease'
            }}>
              <img src={product.image} alt={product.name} style={{
                width: '100%',
                height: '12rem',
                objectFit: 'cover',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem'
              }} />
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>{product.name}</div>
              <div style={{
                color: 'var(--text-color)',
                opacity: 0.7
              }}>${product.price}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
