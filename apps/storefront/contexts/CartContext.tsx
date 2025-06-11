'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useDeviceId } from '@/hooks/useDeviceId';
import Cookies from 'js-cookie';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variant?: string;
  variantId?: string;
  description?: string;
  sku?: string;
  inStock?: boolean;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  minOrderValue: number;
  expiryDate: string;
  maxUsage: number;
  description: string;
  discountAmount?: number;
}

export interface CartData {
  id: string;
  userId: string | null;
  total: number;
  itemCount: number;
  items: CartItem[];
  isCheckedOut: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface CartContextType {
  cartId: string | null;
  items: CartItem[];
  addItem: (item: Partial<CartItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  isEmpty: boolean;
  itemCount: number;
  loading: boolean;
  error: string | null;
  coupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  couponLoading: boolean;
  couponError: string | null;
  refreshCart: (shouldRefreshProducts?: boolean) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { deviceId } = useDeviceId();
  
  // Fetch cart data from API
  const fetchCart = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching cart with deviceId:', deviceId);
      
      // Add refresh=false parameter to prevent auto-refresh of product data
      const response = await axios.get('/api/cart?refresh=false', {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      console.log('Cart data received:', response.data);
      setCartData(response.data);
      
      // If we have a cart ID but no items, check if there's a coupon to apply
      if (response.data?.id && (!response.data.items || response.data.items.length === 0)) {
        const storedCoupon = localStorage.getItem('cart_coupon');
        if (storedCoupon) {
          try {
            const couponData = JSON.parse(storedCoupon);
            console.log('Applying stored coupon to new cart:', couponData);
            await applyCoupon(couponData.code);
          } catch (error) {
            console.error('Failed to apply stored coupon to new cart:', error);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch cart';
      setError(errorMessage);
      // If the cart wasn't found, create an empty cart data structure
      setCartData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize cart
  useEffect(() => {
    if (deviceId) {
      fetchCart();
    }
  }, [deviceId]);
  
  // Refresh cart data
  const refreshCart = async (shouldRefreshProducts: boolean = false) => {
    if (!deviceId || !cartData?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing cart data');
      
      // Add refresh parameter based on the shouldRefreshProducts flag
      const refreshParam = shouldRefreshProducts ? 'true' : 'false';
      const response = await axios.get(`/api/cart?cartId=${cartData.id}&refresh=${refreshParam}`, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      setCartData(response.data);
    } catch (error: any) {
      console.error('Error refreshing cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Load coupon from localStorage
  useEffect(() => {
    const storedCoupon = localStorage.getItem('cart_coupon');
    
    if (storedCoupon) {
      try {
        setCoupon(JSON.parse(storedCoupon));
      } catch (error) {
        console.error('Failed to parse coupon from localStorage:', error);
      }
    }
  }, []);
  
  // Save coupon to localStorage
  useEffect(() => {
    if (coupon) {
      localStorage.setItem('cart_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('cart_coupon');
    }
  }, [coupon]);
  
  // Add item to cart
  const addItem = async (item: Partial<CartItem>) => {
    if (!deviceId) return;
    
    // Validate that item has required fields
    if (!item.productId && !item.id) {
      setError("Product ID is required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const requestData = {
        productId: item.productId || item.id, // Use productId if available, otherwise use id
        variantId: item.variantId,
        quantity: item.quantity || 1,
        name: item.name || 'Product',
        price: item.price || 0,
        imageUrl: item.imageUrl || '/api/placeholder',
        variant: item.variant,
        description: item.description || `Product ${item.name || ''}`,
        sku: item.sku || `SKU-${(item.productId || item.id || '').substring(0, 8)}`,
        inStock: true
      };
      
      console.log('Adding item to cart:', requestData);
      
      const response = await axios.post('/api/cart/items', requestData, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      setCartData(response.data);
    } catch (error: any) {
      console.error('Error adding item to cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add item to cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (id: string) => {
    if (!deviceId || !cartData?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Removing item ${id} from cart ${cartData.id}`);
      
      const response = await axios.delete(`/api/cart/items/${id}?cartId=${cartData.id}`, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      console.log('Remove item response:', response.data);
      
      // If the response contains updated cart data, use it
      if (response.data && (response.data.id || response.data.items)) {
        setCartData(response.data);
      } else {
        // If not, manually update the cart data by removing the item
        setCartData(prevData => {
          if (!prevData) return null;
          
          const updatedItems = prevData.items.filter(item => item.id !== id);
          const updatedItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          return {
            ...prevData,
            items: updatedItems,
            itemCount: updatedItemCount,
            total: updatedTotal
          };
        });
      }
    } catch (error: any) {
      console.error('Error removing item from cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove item from cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Update item quantity
  const updateQuantity = async (id: string, quantity: number) => {
    if (!deviceId || !cartData?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.put(`/api/cart/items/${id}?cartId=${cartData.id}`, {
        quantity
      }, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      // After updating the item quantity, fetch the full cart to get the updated state
      await refreshCart(false);
    } catch (error: any) {
      console.error('Error updating cart item quantity:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update item quantity';
      setError(errorMessage);
      
      // Even if there was an error, try to refresh the cart to ensure we have the latest state
      try {
        await refreshCart(false);
      } catch (refreshError) {
        console.error('Failed to refresh cart after quantity update error:', refreshError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Clear cart
  const clearCart = async () => {
    if (!deviceId || !cartData?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.delete(`/api/cart?cartId=${cartData.id}`, {
        headers: {
          'x-device-id': deviceId
        }
      });
      setCartData(response.data);
      setCoupon(null);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clear cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply coupon code
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, orderTotal: subtotal }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setCouponError(data.error);
        setCouponLoading(false);
        return { success: false, message: data.error };
      }
      
      setCoupon(data.coupon);
      setCouponLoading(false);
      return { success: true, message: 'Coupon applied successfully!' };
    } catch (error) {
      console.error('Error applying coupon:', error);
      const errorMessage = 'Failed to apply coupon. Please try again.';
      setCouponError(errorMessage);
      setCouponLoading(false);
      return { success: false, message: errorMessage };
    }
  };
  
  // Remove coupon code
  const removeCoupon = async () => {
    setCoupon(null);
    setCouponError(null);
  };
  
  // Derived values
  const items = cartData?.items || [];
  const subtotal = cartData?.total || 0;
  
  // Calculate discount based on coupon type
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);
  }
  
  // Shipping calculation (free if coupon type is 'shipping' or order is over $100)
  const baseShipping = subtotal > 100 ? 0 : 10;
  const shippingDiscount = coupon && coupon.type === 'shipping' ? baseShipping : 0;
  const shipping = Math.max(0, baseShipping - shippingDiscount);
  
  // Calculate tax after discount
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * 0.07; // 7% tax
  
  const total = taxableAmount + shipping + tax;
  const isEmpty = items.length === 0;
  const itemCount = cartData?.itemCount || 0;
  
  const value = {
    cartId: cartData?.id || null,
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    isEmpty,
    itemCount,
    loading,
    error,
    coupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError,
    refreshCart
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 