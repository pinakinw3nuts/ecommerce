import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const featured = searchParams.get('featured');
  const limit = searchParams.get('limit');

  // Mock data for featured products
  const products = [
    { 
      id: "1", 
      name: "Classic T-Shirt", 
      price: 19.99, 
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop", 
      slug: "classic-t-shirt" 
    },
    { 
      id: "2", 
      name: "Wireless Headphones", 
      price: 89.99, 
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop", 
      slug: "wireless-headphones" 
    },
    { 
      id: "3", 
      name: "Smart Watch", 
      price: 199.99, 
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1528&auto=format&fit=crop", 
      slug: "smart-watch" 
    },
    { 
      id: "4", 
      name: "Running Shoes", 
      price: 79.99, 
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop", 
      slug: "running-shoes" 
    }
  ];

  // Apply limit if provided
  const limitNum = limit ? parseInt(limit) : products.length;
  const limitedProducts = products.slice(0, limitNum);

  return NextResponse.json({
    products: limitedProducts
  });
} 