import { NextRequest, NextResponse } from 'next/server';
import { RelatedProduct } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // In a real app, you would fetch related products based on the product's
    // category, tags, or other relationships from a database
    // Here we're creating mock related products
    
    // Define product categories and product images by category
    const categories = ['clothing', 'electronics', 'home', 'accessories', 'beauty'];
    
    // Determine category based on slug
    let category = 'clothing';
    if (slug.includes('shirt') || slug.includes('tee') || slug.includes('sweater') || slug.includes('jacket')) {
      category = 'clothing';
    } else if (slug.includes('phone') || slug.includes('laptop') || slug.includes('headphone') || slug.includes('speaker')) {
      category = 'electronics';
    } else if (slug.includes('chair') || slug.includes('table') || slug.includes('sofa') || slug.includes('bed')) {
      category = 'home';
    } else if (slug.includes('watch') || slug.includes('glasses') || slug.includes('bag')) {
      category = 'accessories';
    } else if (slug.includes('cream') || slug.includes('lotion') || slug.includes('makeup')) {
      category = 'beauty';
    }
    
    // Define popular products by category
    const popularProducts: Record<string, RelatedProduct[]> = {
      clothing: [
        {
          id: 'c1',
          title: 'Classic Cotton T-Shirt',
          price: '$29.99',
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
          productId: 'classic-cotton-t-shirt-special-2',
          rating: 4.5,
        },
        {
          id: 'c2',
          title: 'Slim Fit Jeans',
          price: '$49.99',
          imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format',
          productId: 'slim-fit-jeans-special-3',
          rating: 4.2,
        },
        {
          id: 'c3',
          title: 'Leather Jacket',
          price: '$129.99',
          imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format',
          productId: 'leather-jacket-special-1',
          rating: 4.8,
        },
        {
          id: 'c4',
          title: 'Wool Blend Sweater',
          price: '$59.99',
          imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&auto=format',
          productId: 'wool-blend-sweater',
          rating: 4.3,
        },
      ],
      electronics: [
        {
          id: 'e1',
          title: 'Wireless Headphones',
          price: '$89.99',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format',
          productId: 'wireless-headphones',
          rating: 4.6,
        },
        {
          id: 'e2',
          title: 'Smart Watch',
          price: '$199.99',
          imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format',
          productId: 'smart-watch',
          rating: 4.4,
        },
        {
          id: 'e3',
          title: 'Bluetooth Speaker',
          price: '$79.99',
          imageUrl: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500&auto=format',
          productId: 'bluetooth-speaker',
          rating: 4.3,
        },
        {
          id: 'e4',
          title: 'Ultra HD Monitor',
          price: '$349.99',
          imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500&auto=format',
          productId: 'ultra-hd-monitor',
          rating: 4.7,
        },
      ],
      home: [
        {
          id: 'h1',
          title: 'Modern Coffee Table',
          price: '$129.99',
          imageUrl: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=500&auto=format',
          productId: 'modern-coffee-table',
          rating: 4.4,
        },
        {
          id: 'h2',
          title: 'Ergonomic Desk Chair',
          price: '$199.99',
          imageUrl: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&auto=format',
          productId: 'ergonomic-desk-chair',
          rating: 4.5,
        },
        {
          id: 'h3',
          title: 'Cozy Throw Blanket',
          price: '$39.99',
          imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500&auto=format',
          productId: 'cozy-throw-blanket',
          rating: 4.8,
        },
        {
          id: 'h4',
          title: 'Decorative Pillow Set',
          price: '$49.99',
          imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&auto=format',
          productId: 'decorative-pillow-set',
          rating: 4.2,
        },
      ],
      accessories: [
        {
          id: 'a1',
          title: 'Polarized Sunglasses',
          price: '$89.99',
          imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format',
          productId: 'polarized-sunglasses-special-4',
          rating: 4.7,
        },
        {
          id: 'a2',
          title: 'Leather Wallet',
          price: '$59.99',
          imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format',
          productId: 'leather-wallet',
          rating: 4.5,
        },
        {
          id: 'a3',
          title: 'Canvas Backpack',
          price: '$69.99',
          imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format',
          productId: 'canvas-backpack',
          rating: 4.3,
        },
        {
          id: 'a4',
          title: 'Stainless Steel Watch',
          price: '$129.99',
          imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format',
          productId: 'stainless-steel-watch',
          rating: 4.6,
        },
      ],
      beauty: [
        {
          id: 'b1',
          title: 'Facial Moisturizer',
          price: '$34.99',
          imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format',
          productId: 'facial-moisturizer',
          rating: 4.8,
        },
        {
          id: 'b2',
          title: 'Natural Soap Set',
          price: '$24.99',
          imageUrl: 'https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?w=500&auto=format',
          productId: 'natural-soap-set',
          rating: 4.6,
        },
        {
          id: 'b3',
          title: 'Essential Oil Collection',
          price: '$49.99',
          imageUrl: 'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&auto=format',
          productId: 'essential-oil-collection',
          rating: 4.5,
        },
        {
          id: 'b4',
          title: 'Premium Shampoo',
          price: '$19.99',
          imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format',
          productId: 'premium-shampoo',
          rating: 4.4,
        },
      ],
    };
    
    // Get products from the same category
    let relatedProducts = popularProducts[category];
    
    // If no products in category or category not found, use default products
    if (!relatedProducts || relatedProducts.length === 0) {
      // Combine all products from all categories
      relatedProducts = Object.values(popularProducts).flat();
    }
    
    // Filter out the current product if it's in the related products
    relatedProducts = relatedProducts.filter(product => product.productId !== slug);
    
    // Shuffle the array to randomize results a bit
    const shuffled = [...relatedProducts].sort(() => 0.5 - Math.random());
    
    // Return 4 related products or less if not enough
    const count = Math.min(shuffled.length, 4);
    const result = shuffled.slice(0, count);
    
    return NextResponse.json({ relatedProducts: result });
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related products' },
      { status: 500 }
    );
  }
} 