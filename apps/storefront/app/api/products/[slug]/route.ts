import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/lib/types';

// Mock product data
const mockProducts: Record<string, Product> = {
  'premium-cotton-t-shirt': {
    id: 'premium-cotton-t-shirt',
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
  },
  'slim-fit-jeans': {
    id: 'slim-fit-jeans',
    name: 'Slim Fit Jeans',
    slug: 'slim-fit-jeans',
    description: 'Modern slim fit jeans made from premium denim. Flexible and comfortable for all-day wear.',
    price: 59.99,
    discountedPrice: 49.99,
    rating: 4.2,
    reviewCount: 83,
    images: [
      '/api/placeholder',
      '/api/placeholder',
      '/api/placeholder',
    ],
    colors: ['Blue', 'Black', 'Gray'],
    sizes: ['28', '30', '32', '34', '36', '38'],
  },
  'classic-oxford-shirt': {
    id: 'classic-oxford-shirt',
    name: 'Classic Oxford Shirt',
    slug: 'classic-oxford-shirt',
    description: 'Timeless oxford shirt made from high-quality cotton. Perfect for both casual and formal occasions.',
    price: 49.99,
    discountedPrice: 39.99,
    rating: 4.0,
    reviewCount: 65,
    images: [
      '/api/placeholder',
      '/api/placeholder',
      '/api/placeholder',
    ],
    colors: ['White', 'Blue', 'Pink', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
};

// Generate product details for a specific slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // In a real app, you would fetch this data from a database
    // Here we're creating mock data based on the slug
    const productName = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Parse the product ID from the slug if it ends with a number
    const slugParts = slug.split('-');
    const idMatch = slugParts[slugParts.length - 1].match(/(\d+)$/);
    const productId = idMatch ? idMatch[0] : Math.floor(Math.random() * 1000).toString();
    
    // Determine product category from slug
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
    
    // Generate random price and discount
    const basePrice = Math.floor(Math.random() * 150) + 19.99;
    const price = parseFloat(basePrice.toFixed(2));
    const hasDiscount = Math.random() > 0.3;
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
    const discountedPrice = hasDiscount 
      ? parseFloat((price * (1 - discountPercentage / 100)).toFixed(2)) 
      : price;
    
    // Define different image collections for different product types
    const imageCollections = {
      clothing: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&auto=format',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format',
      ],
      electronics: [
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format',
        'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=500&auto=format',
        'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=500&auto=format',
      ],
      home: [
        'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=500&auto=format',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&auto=format',
        'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=500&auto=format',
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format',
      ],
      accessories: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format',
        'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&auto=format',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format',
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format',
      ],
      beauty: [
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&auto=format',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format',
        'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=500&auto=format',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format',
      ],
    };
    
    // Get specific product image collections
    const productImages = imageCollections[category as keyof typeof imageCollections] || imageCollections.clothing;
    
    // Check for specific product slugs and use special image sets
    const specialProductImageMap: Record<string, string[]> = {
      'leather-jacket-special-1': [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format',
        'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=500&auto=format',
        'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=500&auto=format',
        'https://images.unsplash.com/photo-1525695230005-efd074980869?w=500&auto=format',
      ],
      'classic-cotton-t-shirt-special-2': [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format',
        'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=500&auto=format',
      ],
      'slim-fit-jeans-special-3': [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format',
        'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=500&auto=format',
        'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=500&auto=format',
        'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format',
      ],
      'polarized-sunglasses-special-4': [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format',
        'https://images.unsplash.com/photo-1577803645773-f96470509666?w=500&auto=format',
        'https://images.unsplash.com/photo-1588976712485-a99a80240be8?w=500&auto=format',
        'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=500&auto=format',
      ],
    };
    
    // Use special images if available, otherwise use category-based images
    const images = specialProductImageMap[slug] || productImages;
    
    // Generate a description based on the product name
    const descriptions = [
      `Premium quality ${productName.toLowerCase()} with exceptional craftsmanship and attention to detail.`,
      `High-quality ${productName.toLowerCase()} designed for both style and comfort. Perfect for any occasion.`,
      `Durable and stylish ${productName.toLowerCase()} made from premium materials for long-lasting performance.`,
      `Elegant ${productName.toLowerCase()} featuring modern design and premium materials.`,
    ];
    
    const product = {
      id: `prod-${productId}`,
      name: productName,
      slug: slug,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      price: price,
      discountedPrice: hasDiscount ? discountedPrice : price,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount: Math.floor(Math.random() * 200) + 5,
      images: images,
      colors: ['Black', 'White', 'Navy', 'Gray'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      categories: [category],
      inStock: Math.random() > 0.1,
    };
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
} 