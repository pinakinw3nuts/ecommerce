'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WishlistItem } from '@/lib/types';
import axios from 'axios';

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  isEmpty: boolean;
  itemCount: number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);

  // Fetch wishlist count
  const fetchWishlistCount = async () => {
    try {
      const response = await axios.get('/api/wishlist/count', { withCredentials: true });
      setItemCount(response.data?.data?.count || 0);
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
      setItemCount(0);
    }
  };

  // Fetch wishlist from API
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/wishlist', { withCredentials: true });
      const wishlistData = response.data?.data || {};
      const items = (wishlistData.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.productName,
        price: item.price,
        imageUrl: item.productImage,
        productImage: item.productImage,
        metadata: item.metadata || {},
        slug: item.metadata?.slug || ''
      }));
      setItems(items);
      setItemCount(items.length); // Update count based on items length
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setItems([]);
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const isEmpty = items.length === 0;

  // Wishlist methods
  const addItem = async (newItem: WishlistItem) => {
    try {
      const response = await axios.post('/api/wishlist/add', {
        productId: newItem.productId,
        variantId: newItem.variantId || undefined,
        name: newItem.name,
        imageUrl: newItem.imageUrl || newItem.productImage,
        price: Number(newItem.price),
        slug: newItem.slug,
        ...(newItem.metadata?.sku && { sku: newItem.metadata.sku }),
        ...(newItem.metadata?.description && { description: newItem.metadata.description }),
        ...(newItem.metadata?.category && { category: newItem.metadata.category }),
        ...(newItem.metadata?.brand && { brand: newItem.metadata.brand }),
        metadata: newItem.metadata
      });

      if (response.data?.data) {
        await fetchWishlist(); // Refresh the wishlist
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeItem = async (id: string) => {
    try {
      await axios.post('/api/wishlist/remove', { productId: id });
      await fetchWishlist(); // Refresh the wishlist
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.productId === id);
  };

  const clearWishlist = () => {
    setItems([]);
    setItemCount(0);
  };

  const value = {
    items,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
    isEmpty,
    itemCount,
    loading
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