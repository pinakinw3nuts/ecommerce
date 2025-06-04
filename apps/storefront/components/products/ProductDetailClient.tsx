'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Share2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { Product, RelatedProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function ProductDetailClient({ 
  product, 
  relatedProducts 
}: { 
  product: Product; 
  relatedProducts: RelatedProduct[] 
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const productInWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      quantity: quantity,
      imageUrl: product.images[0],
      variant: selectedSize 
        ? (selectedColor ? `${selectedColor} / ${selectedSize}` : selectedSize)
        : (selectedColor || undefined)
    });
    
    showToast({
      message: `${product.name} added to cart`,
      type: 'cart',
      duration: 3000
    });
  };
  
  const handleWishlistToggle = () => {
    if (productInWishlist) {
      removeFromWishlist(product.id);
      showToast({
        message: `${product.name} removed from wishlist`,
        type: 'wishlist',
        duration: 3000
      });
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.discountedPrice || product.price,
        imageUrl: product.images[0],
        slug: product.slug
      });
      showToast({
        message: `${product.name} added to wishlist`,
        type: 'wishlist',
        duration: 3000
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-8 text-gray-500">
        <Link href="/" className="hover:text-[#D23F57]">Home</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href="/products" className="hover:text-[#D23F57]">Products</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">{product.name}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
            <Image 
              src={product.images[selectedImage] || '/api/placeholder'} 
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative aspect-square overflow-hidden rounded-md border ${
                  selectedImage === index ? 'ring-2 ring-[#D23F57]' : ''
                }`}
              >
                <Image 
                  src={image || '/api/placeholder'} 
                  alt={`${product.name} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating) ? 'fill-current' : 'fill-none'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
          </div>
          
          <div className="flex items-center gap-4">
            {product.discountedPrice ? (
              <>
                <span className="text-2xl font-semibold text-[#D23F57]">
                  {formatPrice(product.discountedPrice)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="bg-[#D23F57]/10 text-[#D23F57] text-sm font-medium px-2 py-1 rounded">
                  {Math.round((1 - product.discountedPrice / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            )}
          </div>
          
          <p className="text-gray-600">{product.description}</p>
          
          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Color</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border rounded-md ${
                      selectedColor === color
                        ? 'border-[#D23F57] bg-[#D23F57]/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center border rounded-md ${
                      selectedSize === size
                        ? 'border-[#D23F57] bg-[#D23F57]/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-2">Quantity</h3>
            <div className="flex items-center border rounded-md w-32">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-10 text-center border-x focus:outline-none"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 bg-[#D23F57] hover:bg-[#c02c45] text-white"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            
            <Button 
              variant="outline" 
              className={`flex items-center ${productInWishlist ? 'text-[#D23F57] border-[#D23F57]' : ''}`}
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-5 w-5 mr-2 ${productInWishlist ? 'fill-[#D23F57]' : ''}`} />
              {productInWishlist ? 'Wishlisted' : 'Wishlist'}
            </Button>
            
            <Button variant="outline" className="flex items-center">
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <Link 
                href={`/products/${product.productId}`} 
                key={product.id}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
                  <Image 
                    src={product.imageUrl || '/api/placeholder'} 
                    alt={product.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium group-hover:text-[#D23F57]">{product.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-900">{product.price}</span>
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 