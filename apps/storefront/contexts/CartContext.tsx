'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variant?: string;
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

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  isEmpty: boolean;
  itemCount: number;
  coupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  couponLoading: boolean;
  couponError: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Load cart from localStorage on component mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    const storedCoupon = localStorage.getItem('cart_coupon');
    
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    
    if (storedCoupon) {
      try {
        setCoupon(JSON.parse(storedCoupon));
      } catch (error) {
        console.error('Failed to parse coupon from localStorage:', error);
      }
    }
    
    setInitialized(true);
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, initialized]);
  
  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      if (coupon) {
        localStorage.setItem('cart_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('cart_coupon');
      }
    }
  }, [coupon, initialized]);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
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
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
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
  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };
  
  // Cart methods
  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(item => 
        item.id === newItem.id && item.variant === newItem.variant
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        return [...currentItems, newItem];
      }
    });
  };
  
  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };
  
  const value = {
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
    coupon,
    applyCoupon,
    removeCoupon,
    couponLoading,
    couponError
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