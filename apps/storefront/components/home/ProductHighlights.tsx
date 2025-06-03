'use client';

import { Card } from '@components/ui/Card';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBagIcon } from '@components/icons';

type ProductHighlight = {
  id: string;
  name: string;
  price: number;
  image: string;
  tag: string;
  slug: string;
};

const featuredProducts: ProductHighlight[] = [
  {
    id: 'prod_1',
    name: 'Premium Leather Backpack',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'Bestseller',
    slug: 'premium-leather-backpack',
  },
  {
    id: 'prod_2',
    name: 'Minimalist Analog Watch',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'Editor\'s Choice',
    slug: 'minimalist-analog-watch',
  },
  {
    id: 'prod_3',
    name: 'Wireless Noise-Cancelling Headphones',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'New Arrival',
    slug: 'wireless-noise-cancelling-headphones',
  },
  {
    id: 'prod_4',
    name: 'Handcrafted Ceramic Mug Set',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'Limited Edition',
    slug: 'handcrafted-ceramic-mug-set',
  },
  {
    id: 'prod_5',
    name: 'Organic Cotton T-Shirt',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'Eco-Friendly',
    slug: 'organic-cotton-t-shirt',
  },
  {
    id: 'prod_6',
    name: 'Smart Home Assistant',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tag: 'Top Rated',
    slug: 'smart-home-assistant',
  },
];

const ProductTile = ({ product }: { product: ProductHighlight }) => {
  return (
    <Card className="group h-full overflow-hidden border-border hover:border-primary/50 transition-all duration-300">
      <div className="relative">
        <div className="aspect-[4/5] overflow-hidden bg-muted/20">
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={500}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className="inline-block bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
            {product.tag}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-base mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
          <button 
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBagIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default function ProductHighlights() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
      }
    },
  };

  return (
    <section className="py-16 md:py-20 bg-muted/10" aria-labelledby="product-highlights-heading">
      <div className="container mx-auto px-4 max-w-[1440px]">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 
            id="product-highlights-heading" 
            className="text-2xl md:text-3xl font-bold mb-3"
          >
            Handpicked Just for You
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Discover our curated selection of premium products that combine style, quality, and value.
          </p>
        </motion.div>

        <div className="overflow-hidden -mx-4">
          <div className="px-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-8 md:hidden">
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="snap-start scroll-ml-4 min-w-[75%] sm:min-w-[45%]"
              >
                <Link href={`/products/${product.slug}`} className="block h-full">
                  <ProductTile product={product} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={item}>
              <Link href={`/products/${product.slug}`} className="block h-full">
                <ProductTile product={product} />
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
} 