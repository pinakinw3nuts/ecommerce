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
    let existingId = localStorage.getItem('device_id') || Cookies.get('device_id');
    if (!existingId) {
      existingId = uuidv4();
      localStorage.setItem('device_id', existingId);
      Cookies.set('device_id', existingId, { expires: 30, path: '/' });
    } else {
      localStorage.setItem('device_id', existingId);
      Cookies.set('device_id', existingId, { expires: 30, path: '/' });
    }
    setDeviceId(existingId);
  }, []);

  return { deviceId };
} 