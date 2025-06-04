'use client';

import ProductCard from '../ui/ProductCard';

type Product = {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  rating?: number;
};

export default function ProductGrid() {
  // Sample product data
  const products: Product[] = [
    {
      id: 'p1',
      title: 'Premium Leather Jacket',
      price: '$199.99',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1470&auto=format&fit=crop',
      rating: 4.5,
    },
    {
      id: 'p2',
      title: 'Casual Summer T-Shirt',
      price: '$29.99',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1480&auto=format&fit=crop',
      rating: 4.2,
    },
    {
      id: 'p3',
      title: 'Classic Denim Jeans',
      price: '$59.99',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1626&auto=format&fit=crop',
      rating: 4.8,
    },
    {
      id: 'p4',
      title: 'Stylish Sunglasses',
      price: '$79.99',
      imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1480&auto=format&fit=crop',
      rating: 4.0,
    },
    {
      id: 'p5',
      title: 'Minimalist Watch',
      price: '$129.99',
      imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1289&auto=format&fit=crop',
      rating: 4.7,
    },
    {
      id: 'p6',
      title: 'Running Sneakers',
      price: '$89.99',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop',
      rating: 4.3,
    },
    {
      id: 'p7',
      title: 'Leather Wallet',
      price: '$49.99',
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1374&auto=format&fit=crop',
      rating: 4.6,
    },
    {
      id: 'p8',
      title: 'Wireless Headphones',
      price: '$149.99',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1470&auto=format&fit=crop',
      rating: 4.9,
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
      <div className="mb-8 md:mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-neutral-900">Featured Products</h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Discover our most popular items loved by customers worldwide
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            productId={product.id}
            title={product.title}
            price={product.price}
            imageUrl={product.imageUrl}
            rating={product.rating}
          />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <button className="px-8 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors duration-300 font-medium rounded-md">
          View All Products
        </button>
      </div>
    </section>
  );
} 