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
  additionalImages?: string[];
  variant?: string;
  variantId?: string;
  variantName?: string;
  description?: string;
  sku?: string;
  inStock?: boolean;
  brand?: {
    id?: string;
    name?: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name?: string;
  };
  attributes?: {
    [key: string]: string | number | boolean;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    weight?: number;
    unit?: string;
  };
  originalPrice?: number;
  salePrice?: number;
  slug?: string;
  productSnapshot?: {
    name?: string;
    imageUrl?: string;
    variantName?: string;
    [key: string]: any;
  };
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
  isCartLoading: boolean;
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
      
      // Add refresh=false parameter to prevent auto-refresh of product data
      const response = await axios.get('/api/cart?refresh=false', {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      setCartData(response.data);
      
      // If we have a cart ID but no items, check if there's a coupon to apply
      if (response.data?.id && (!response.data.items || response.data.items.length === 0)) {
        const storedCoupon = localStorage.getItem('cart_coupon');
        if (storedCoupon) {
          try {
            const couponData = JSON.parse(storedCoupon);
            await applyCoupon(couponData.code);
          } catch (error) {
            // Failed to apply stored coupon to new cart
          }
        }
      }
    } catch (error: any) {
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
      
      // Add refresh parameter based on the shouldRefreshProducts flag
      const refreshParam = shouldRefreshProducts ? 'true' : 'false';
      const response = await axios.get(`/api/cart?cartId=${cartData.id}&refresh=${refreshParam}`, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      setCartData(response.data);
    } catch (error: any) {
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
        // Failed to parse coupon from localStorage
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
        variantName: item.variantName,
        description: item.description || `Product ${item.name || ''}`,
        sku: item.sku || `SKU-${(item.productId || item.id || '').substring(0, 8)}`,
        inStock: true,
        brand: item.brand,
        category: item.category,
        attributes: item.attributes,
        dimensions: item.dimensions,
        additionalImages: item.additionalImages,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        slug: item.slug
      };
      
      const response = await axios.post('/api/cart/items', requestData, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      setCartData(response.data);
    } catch (error: any) {
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
      
      const response = await axios.delete(`/api/cart/items/${id}?cartId=${cartData.id}`, {
        headers: {
          'x-device-id': deviceId
        }
      });
      
      // If the response contains updated cart data, use it
      if (response.data && (response.data.id || response.data.items)) {
        setCartData(response.data);
      } else {
        // If not, manually update the cart data by removing the item
        setCartData(prevData => {
          if (!prevData) return null;
          
          const updatedItems = prevData.items.filter(item => item.id !== id);
          const updatedItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...prevData,
            items: updatedItems,
            itemCount: updatedItemCount,
            total: calculateTotal(updatedItems, coupon)
          };
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove item from cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Update item quantity
  const updateQuantity = async (id: string, quantity: number) => {
    if (!deviceId || !cartData?.id || quantity < 1) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(`/api/cart/items/${id}?cartId=${cartData.id}`, { quantity }, { headers: { 'x-device-id': deviceId } });
      
      setCartData(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update item quantity';
      setError(errorMessage);
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
      
      await axios.delete(`/api/cart?cartId=${cartData.id}`, {
        headers: { 'x-device-id': deviceId }
      });
      
      setCartData(null);
      setCoupon(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clear cart';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply coupon
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!deviceId || !cartData?.id) {
      return { success: false, message: 'Cart not initialized' };
    }
    
    try {
      setCouponLoading(true);
      setCouponError(null);
      
      const response = await axios.post(
        `/api/cart/coupon`, 
        { code, cartId: cartData.id },
        { headers: { 'x-device-id': deviceId } }
      );
      
      if (response.data.coupon) {
        setCoupon(response.data.coupon);
        setCartData(response.data.cart || response.data);
        return { success: true, message: 'Coupon applied successfully' };
      } else {
        return { success: false, message: 'Invalid coupon response' };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to apply coupon';
      setCouponError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Remove coupon
  const removeCoupon = async () => {
    if (!deviceId || !cartData?.id || !coupon) return;
    
    try {
      setCouponLoading(true);
      setCouponError(null);
      
      const response = await axios.delete(
        `/api/cart/coupon?cartId=${cartData.id}`,
        { headers: { 'x-device-id': deviceId } }
      );
      
      setCoupon(null);
      setCartData(response.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove coupon';
      setCouponError(errorMessage);
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Calculate total (subtotal - discount)
  const calculateTotal = (items: CartItem[], coupon: Coupon | null): number => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (!coupon) return subtotal;
    
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
    
    return subtotal - discount;
  };
  
  // Calculate values
  const subtotal = cartData?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const shipping = 0; // Calculate based on your business logic
  const tax = 0; // Calculate based on your business logic
  const discount = coupon ? (coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value) : 0;
  const total = subtotal - discount + shipping + tax;
  const isEmpty = !cartData?.items || cartData.items.length === 0;
  const itemCount = cartData?.itemCount || 0;
  
  const value: CartContextType = {
    cartId: cartData?.id || null,
    items: cartData?.items || [],
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
    isCartLoading: loading,
    error,
    coupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError,
    refreshCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
} 