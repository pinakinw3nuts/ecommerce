'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from '@/lib/constants';

export default function AuthDebug() {
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState<string | undefined>(undefined);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Check cookies on component mount and every 2 seconds
    const checkCookies = () => {
      const accessTokenValue = Cookies.get(ACCESS_TOKEN_NAME);
      const refreshTokenValue = Cookies.get(REFRESH_TOKEN_NAME);
      
      setAccessToken(accessTokenValue);
      setRefreshToken(refreshTokenValue);
    };
    
    // Initial check
    checkCookies();
    
    // Set up interval for checking
    const interval = setInterval(checkCookies, 2000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, []);

  const toggleDebug = () => {
    setShowDebug(prev => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={toggleDebug}
        className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs"
      >
        Debug Auth
      </button>
      
      {showDebug && (
        <div className="mt-2 p-4 bg-white border border-gray-300 rounded-md shadow-md text-xs w-80">
          <h3 className="font-bold mb-2">Auth Debug</h3>
          
          <div className="mb-2">
            <div className="font-semibold">Access Token:</div>
            <div className="truncate">{accessToken ? `${accessToken.substring(0, 15)}...` : 'Not found'}</div>
          </div>
          
          <div className="mb-2">
            <div className="font-semibold">Refresh Token:</div>
            <div className="truncate">{refreshToken ? `${refreshToken.substring(0, 15)}...` : 'Not found'}</div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button 
              onClick={() => {
                const accessTokenValue = Cookies.get(ACCESS_TOKEN_NAME);
                const refreshTokenValue = Cookies.get(REFRESH_TOKEN_NAME);
                console.log('Access Token:', accessTokenValue);
                console.log('Refresh Token:', refreshTokenValue);
                alert('Tokens logged to console');
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
            >
              Log to Console
            </button>
            
            <button 
              onClick={() => {
                // Set test cookies to verify cookie functionality
                Cookies.set('test_cookie', 'test_value', { path: '/' });
                alert('Test cookie set. Check if it appears in the list.');
              }}
              className="bg-green-500 text-white px-2 py-1 rounded-md text-xs"
            >
              Set Test Cookie
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 