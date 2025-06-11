'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Share2, Loader2, ShoppingBag, Bell, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/components/ui/Toast';
import { Product } from '@/lib/types';

interface ProductActionsProps {
  product: Product;
  selectedColor: string;
  selectedSize: string;
}

export default function ProductActions({ 
  product, 
  selectedColor, 
  selectedSize 
}: ProductActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const productInWishlist = isInWishlist(product.id);
  const isOutOfStock = product.inStock === false || 
                       (product.stockQuantity !== undefined && product.stockQuantity < 1);
  const isLowStock = !isOutOfStock && product.stockQuantity !== undefined && product.stockQuantity < 5;
  const hasVariants = (product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0);
  const isVariantSelected = (!product.colors || !product.colors.length || selectedColor) && 
                            (!product.sizes || !product.sizes.length || selectedSize);
  
  // Calculate maximum quantity based on stock
  const maxQuantity = product.stockQuantity !== undefined ? product.stockQuantity : 10;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    
    // Validate that variants are selected if needed
    if (hasVariants && !isVariantSelected) {
      showToast({
        message: 'Please select all required options',
        type: 'error',
        duration: 3000
      });
      return;
    }
    
    setIsAddingToCart(true);
    
    // Simulate a network request for demo purposes
    setTimeout(() => {
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
      
      setIsAddingToCart(false);
    }, 800);
  };
  
  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    
    // Validate that variants are selected if needed
    if (hasVariants && !isVariantSelected) {
      showToast({
        message: 'Please select all required options',
        type: 'error',
        duration: 3000
      });
      return;
    }
    
    setIsBuyingNow(true);
    
    try {
      // Add to cart first
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
      
      // Wait a bit to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error during buy now flow:', error);
      showToast({
        message: 'Something went wrong. Please try again.',
        type: 'error',
        duration: 3000
      });
    } finally {
      setIsBuyingNow(false);
    }
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
  
  const handleNotifyMe = () => {
    setIsNotifying(true);
    
    // Simulate notification registration
    setTimeout(() => {
      showToast({
        message: 'You will be notified when this product is back in stock',
        type: 'success',
        duration: 3000
      });
      setIsNotifying(false);
    }, 800);
  };
  
  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description.substring(0, 100) + '...',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast({
        message: 'Link copied to clipboard',
        type: 'success',
        duration: 3000
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stock Status */}
      {isOutOfStock ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-red-700 font-medium">Out of Stock</span>
        </div>
      ) : isLowStock ? (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-amber-700 font-medium">
            Low Stock - Only {product.stockQuantity} left
          </span>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-green-700 font-medium">In Stock</span>
          {product.stockQuantity && (
            <span className="text-green-600 text-sm">
              ({product.stockQuantity} available)
            </span>
          )}
        </div>
      )}
      
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div>
          <h3 className="font-medium mb-2">Quantity</h3>
          <div className="flex items-center border rounded-md w-fit">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="px-3 py-2 text-gray-600 hover:text-[#D23F57] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value < 1) {
                  setQuantity(1);
                } else if (value > maxQuantity) {
                  setQuantity(maxQuantity);
                } else {
                  setQuantity(value);
                }
              }}
              className="px-3 py-2 border-x w-16 text-center focus:outline-none"
              aria-label="Quantity"
            />
            <button
              onClick={() => setQuantity(Math.min(quantity + 1, maxQuantity))}
              disabled={isOutOfStock || quantity >= maxQuantity}
              className="px-3 py-2 text-gray-600 hover:text-[#D23F57] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isOutOfStock ? (
          <Button
            onClick={handleNotifyMe}
            disabled={isNotifying}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-md"
            aria-label="Notify me when available"
          >
            {isNotifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
                <span>Notify Me When Available</span>
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAddToCart}
              disabled={isAddingToCart || isBuyingNow}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-md"
              aria-label="Add to cart"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={handleBuyNow}
              disabled={isAddingToCart || isBuyingNow}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D23F57] hover:bg-[#E6536B] text-white py-3 px-6 rounded-md"
              aria-label="Buy now"
            >
              {isBuyingNow ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Buy Now</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button
          onClick={handleWishlistToggle}
          className={`flex items-center gap-2 py-2 px-4 rounded-md border ${
            productInWishlist
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          aria-label={productInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-5 w-5 ${productInWishlist ? 'fill-current' : ''}`} />
          <span>{productInWishlist ? 'Saved' : 'Save'}</span>
        </Button>
        
        <Button
          onClick={shareProduct}
          className="flex items-center gap-2 py-2 px-4 rounded-md border border-gray-300 hover:border-gray-400"
          aria-label="Share product"
        >
          <Share2 className="h-5 w-5" />
          <span>Share</span>
        </Button>
      </div>
      
      {/* Payment Methods Info */}
      <div className="border border-gray-200 rounded-md p-4 mt-6">
        <h4 className="font-medium mb-2">We Accept</h4>
        <div className="flex flex-wrap gap-2">
          <img src="/images/payment/visa.svg" alt="Visa" className="h-8" />
          <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-8" />
          <img src="/images/payment/paypal.svg" alt="PayPal" className="h-8" />
          <img src="/images/payment/apple-pay.svg" alt="Apple Pay" className="h-8" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Secure payment processing. Your payment information is never stored.
        </p>
      </div>
      
      {/* Shipping & Returns */}
      <div className="border-t border-gray-200 pt-4 text-sm text-gray-600 space-y-2">
        <div className="flex items-start gap-2">
          <ShoppingBag className="h-4 w-4 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">Free shipping</p>
            <p>On orders over $50. Delivery in 4-6 business days.</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ShoppingBag className="h-4 w-4 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">30-day returns</p>
            <p>Return policy allows you to return items within 30 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 