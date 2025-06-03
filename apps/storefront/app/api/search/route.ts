import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Mock product data
const allProducts = [
  { 
    id: "p1", 
    name: "Classic T-Shirt", 
    price: 19.99, 
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop", 
    slug: "classic-t-shirt",
    rating: 4.2,
    category: "clothing"
  },
  { 
    id: "p2", 
    name: "Wireless Headphones", 
    price: 89.99, 
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop", 
    slug: "wireless-headphones",
    rating: 4.5,
    category: "electronics"
  },
  { 
    id: "p3", 
    name: "Smart Watch", 
    price: 199.99, 
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1528&auto=format&fit=crop", 
    slug: "smart-watch",
    rating: 4.8,
    category: "electronics"
  },
  { 
    id: "p4", 
    name: "Running Shoes", 
    price: 79.99, 
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop", 
    slug: "running-shoes",
    rating: 4.0,
    category: "footwear"
  },
  { 
    id: "p5", 
    name: "Leather Wallet", 
    price: 49.99, 
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1374&auto=format&fit=crop", 
    slug: "leather-wallet",
    rating: 4.3,
    category: "accessories"
  },
  { 
    id: "p6", 
    name: "Sunglasses", 
    price: 129.99, 
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1480&auto=format&fit=crop", 
    slug: "sunglasses",
    rating: 4.1,
    category: "accessories"
  },
  { 
    id: "p7", 
    name: "Denim Jeans", 
    price: 59.99, 
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1426&auto=format&fit=crop", 
    slug: "denim-jeans",
    rating: 4.4,
    category: "clothing"
  },
  { 
    id: "p8", 
    name: "Backpack", 
    price: 69.99, 
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1374&auto=format&fit=crop", 
    slug: "backpack",
    rating: 4.6,
    category: "accessories"
  },
  { 
    id: "p9", 
    name: "Bluetooth Speaker", 
    price: 149.99, 
    image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?q=80&w=1480&auto=format&fit=crop", 
    slug: "bluetooth-speaker",
    rating: 4.7,
    category: "electronics"
  },
  { 
    id: "p10", 
    name: "Coffee Mug", 
    price: 14.99, 
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1470&auto=format&fit=crop", 
    slug: "coffee-mug",
    rating: 4.2,
    category: "home"
  },
  { 
    id: "p11", 
    name: "Desk Lamp", 
    price: 39.99, 
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1470&auto=format&fit=crop", 
    slug: "desk-lamp",
    rating: 4.3,
    category: "home"
  },
  { 
    id: "p12", 
    name: "Water Bottle", 
    price: 24.99, 
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1374&auto=format&fit=crop", 
    slug: "water-bottle",
    rating: 4.4,
    category: "accessories"
  },
  { 
    id: "p13", 
    name: "Yoga Mat", 
    price: 29.99, 
    image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=1374&auto=format&fit=crop", 
    slug: "yoga-mat",
    rating: 4.5,
    category: "fitness"
  },
  { 
    id: "p14", 
    name: "Fitness Tracker", 
    price: 99.99, 
    image: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=1374&auto=format&fit=crop", 
    slug: "fitness-tracker",
    rating: 4.6,
    category: "electronics"
  },
  { 
    id: "p15", 
    name: "Plant Pot", 
    price: 19.99, 
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=1372&auto=format&fit=crop", 
    slug: "plant-pot",
    rating: 4.1,
    category: "home"
  }
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '12');

  // Filter by category if provided
  let filteredProducts = [...allProducts];
  if (category) {
    filteredProducts = filteredProducts.filter(product => product.category === category);
  }

  // Sort products if sort parameter is provided
  if (sort) {
    switch (sort) {
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
  }

  // Calculate pagination
  const total = filteredProducts.length;
  const offset = (page - 1) * limit;
  const paginatedProducts = filteredProducts.slice(offset, offset + limit);

  return NextResponse.json({
    products: paginatedProducts,
    total
  });
} 