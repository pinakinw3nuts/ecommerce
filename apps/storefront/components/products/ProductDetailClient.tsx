'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Share2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { Product, RelatedProduct, Review } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { productAPI } from '@/lib/api';

export default function ProductDetailClient({ 
  product, 
  relatedProducts,
  reviews = []
}: { 
  product: Product; 
  relatedProducts: RelatedProduct[];
  reviews?: Review[];
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [allReviews, setAllReviews] = useState<Review[]>(reviews);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isLoadingMoreReviews, setIsLoadingMoreReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(reviews.length >= 10);
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
  
  const loadMoreReviews = async () => {
    if (isLoadingMoreReviews || !hasMoreReviews) return;
    
    try {
      setIsLoadingMoreReviews(true);
      const nextPage = reviewsPage + 1;
      
      const response = await productAPI.getProductReviewsBySlug(product.slug, {
        page: nextPage,
        limit: 10,
        sort: 'newest'
      });
      
      if (response.reviews.length > 0) {
        setAllReviews(prev => [...prev, ...response.reviews]);
        setReviewsPage(nextPage);
        setHasMoreReviews(response.reviews.length >= 10);
      } else {
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
      showToast({
        message: 'Failed to load more reviews',
        type: 'error',
        duration: 3000
      });
    } finally {
      setIsLoadingMoreReviews(false);
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
            <div className="flex items-center border rounded-md w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:text-[#D23F57]"
              >
                -
              </button>
              <span className="px-3 py-2 border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:text-[#D23F57]"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Button 
              onClick={handleAddToCart}
              className="flex items-center gap-2 bg-[#D23F57] hover:bg-[#E63E62] text-white px-6 py-2 rounded-md"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            
            <Button 
              onClick={handleWishlistToggle}
              variant="outline"
              className={`flex items-center gap-2 px-6 py-2 rounded-md ${
                productInWishlist ? 'text-[#D23F57] border-[#D23F57]' : ''
              }`}
            >
              <Heart className={`h-5 w-5 ${productInWishlist ? 'fill-[#D23F57]' : ''}`} />
              {productInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2 px-6 py-2 rounded-md"
            >
              <Share2 className="h-5 w-5" />
              Share
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-12">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'description'
                ? 'border-b-2 border-[#D23F57] text-[#D23F57]'
                : 'text-gray-600'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'reviews'
                ? 'border-b-2 border-[#D23F57] text-[#D23F57]'
                : 'text-gray-600'
            }`}
          >
            Reviews ({product.reviewCount})
          </button>
        </div>
        
        <div className="py-6">
          {activeTab === 'description' ? (
            <div className="prose max-w-none">
              <p>{product.description}</p>
              {/* Additional product details could be added here */}
            </div>
          ) : (
            <div className="space-y-8">
              {allReviews.length > 0 ? (
                <>
                  {allReviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                            {review.user.avatar ? (
                              <Image 
                                src={review.user.avatar} 
                                alt={review.user.name} 
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {review.user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{review.user.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(review.rating) ? 'fill-current' : 'fill-none'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                  
                  {hasMoreReviews && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={loadMoreReviews}
                        variant="outline"
                        disabled={isLoadingMoreReviews}
                        className="flex items-center gap-2"
                      >
                        {isLoadingMoreReviews ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Reviews'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Related Products */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relatedProducts.map((item) => (
            <Link 
              key={item.id} 
              href={`/products/${item.productId}`}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg mb-2">
                <Image 
                  src={item.imageUrl || '/api/placeholder'} 
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-gray-900 group-hover:text-[#D23F57]">{item.title}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[#D23F57] font-medium">{item.price}</span>
                <div className="flex items-center text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-xs text-gray-500 ml-1">{item.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 