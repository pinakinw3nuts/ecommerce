'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WishlistItem } from '@/lib/types';

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  isEmpty: boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  // Load wishlist from localStorage on component mount
  useEffect(() => {
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      try {
        setItems(JSON.parse(storedWishlist));
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage:', error);
      }
    }
    setInitialized(true);
  }, []);
  
  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, initialized]);
  
  const isEmpty = items.length === 0;
  const itemCount = items.length;
  
  // Wishlist methods
  const addItem = (newItem: WishlistItem) => {
    setItems(currentItems => {
      // Check if item already exists in wishlist
      const exists = currentItems.some(item => item.id === newItem.id);
      
      if (exists) {
        return currentItems;
      } else {
        // Add new item if it doesn't exist
        return [...currentItems, newItem];
      }
    });
  };
  
  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  };
  
  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };
  
  const clearWishlist = () => {
    setItems([]);
  };
  
  const value = {
    items,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
    isEmpty,
    itemCount
  };
  
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
} 