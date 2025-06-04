/**
 * Product related types
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountedPrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  colors: string[];
  sizes: string[];
  categories?: string[];
  tags?: string[];
  inStock?: boolean;
  stockQuantity?: number;
}

export interface RelatedProduct {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productId: string;
  rating: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  products: Product[];
}

export interface SEO {
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variant?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  slug: string;
} 