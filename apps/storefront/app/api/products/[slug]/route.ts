import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock product data with detailed information
const productDetails = {
  'classic-t-shirt': {
    id: "p1",
    name: "Classic T-Shirt",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop",
    slug: "classic-t-shirt",
    rating: 4.2,
    category: "clothing",
    description: "A comfortable classic t-shirt made from 100% organic cotton. Perfect for everyday wear with a relaxed fit and soft touch.",
    features: [
      "100% organic cotton",
      "Relaxed fit",
      "Machine washable",
      "Available in multiple colors",
      "Sustainable production"
    ],
    inStock: true
  },
  'wireless-headphones': {
    id: "p2",
    name: "Wireless Headphones",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop",
    slug: "wireless-headphones",
    rating: 4.5,
    category: "electronics",
    description: "High-quality wireless headphones with noise cancellation technology. Enjoy crystal clear sound and up to 20 hours of battery life.",
    features: [
      "Active noise cancellation",
      "20-hour battery life",
      "Bluetooth 5.0",
      "Built-in microphone",
      "Foldable design",
      "Carrying case included"
    ],
    inStock: true
  },
  'smart-watch': {
    id: "p3",
    name: "Smart Watch",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1528&auto=format&fit=crop",
    slug: "smart-watch",
    rating: 4.8,
    category: "electronics",
    description: "A feature-rich smart watch with health tracking, notifications, and a beautiful display. Water resistant up to 50 meters.",
    features: [
      "Heart rate monitoring",
      "Sleep tracking",
      "GPS",
      "Water resistant (50m)",
      "5-day battery life",
      "Compatible with iOS and Android"
    ],
    inStock: true
  },
  'running-shoes': {
    id: "p4",
    name: "Running Shoes",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop",
    slug: "running-shoes",
    rating: 4.0,
    category: "footwear",
    description: "Lightweight and responsive running shoes designed for comfort and performance. Perfect for daily runs and training.",
    features: [
      "Breathable mesh upper",
      "Cushioned midsole",
      "Durable rubber outsole",
      "Reflective details",
      "Available in men's and women's sizes"
    ],
    inStock: false
  }
};

// Helper function to extract slug safely
async function extractSlug(params: any): Promise<string> {
  // In Next.js 14, params might be a Promise
  const resolvedParams = params && typeof params.then === 'function' ? await params : params;
  return resolvedParams?.slug || '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Extract the slug safely
    const slug = await extractSlug(params);
    
    // Check if product exists
    if (slug in productDetails) {
      return NextResponse.json({
        product: productDetails[slug as keyof typeof productDetails]
      });
    }
    
    // Return 404 if product not found
    return new NextResponse(
      JSON.stringify({ error: 'Product not found' }),
      { status: 404, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch product' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 