'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

/**
 * Hook to generate and store a persistent device ID for guest users
 * This ID is used for identifying guest carts
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing device ID from localStorage or cookie
    let existingId = localStorage.getItem('device_id') || Cookies.get('device_id');
    
    // If no device ID exists, create and store a new one
    if (!existingId) {
      existingId = uuidv4();
      localStorage.setItem('device_id', existingId);
      // Set cookie with 30-day expiry and path for entire site
      Cookies.set('device_id', existingId, { expires: 30, path: '/' });
    } else {
      // Ensure the ID is stored in both places
      localStorage.setItem('device_id', existingId);
      Cookies.set('device_id', existingId, { expires: 30, path: '/' });
    }
    
    setDeviceId(existingId);
  }, []);

  return { deviceId };
} 