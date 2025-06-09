'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

type Address = {
  id: string;
  type: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
};

export default function AddressStep() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/addresses');
        
        if (response.data && Array.isArray(response.data)) {
          setAddresses(response.data);
        } else {
          setAddresses([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching addresses:', err);
        setError('Failed to load addresses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Shipping Address</h1>
          <p className="text-gray-500 mt-1">Loading your saved addresses...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Shipping Address</h1>
          <p className="text-red-500 mt-1">{error}</p>
        </div>
        <Link 
          href="/account/address/new?returnUrl=/checkout/address" 
          className="inline-block bg-black text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 transition"
        >
          Add new address
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Shipping Address</h1>
        <p className="text-gray-500 mt-1">Please select the address where you want your order delivered</p>
      </div>

      <form action="/checkout/shipping" method="GET" className="space-y-6">
        {addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <label 
                key={addr.id} 
                className="block border border-gray-200 rounded-lg p-4 hover:border-black hover:shadow-sm transition cursor-pointer"
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="addressId"
                    value={addr.id}
                    defaultChecked={addr.isDefault}
                    required
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{addr.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                        {addr.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {addr.line1}
                      {addr.line2 && <>, {addr.line2}</>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {addr.city}, {addr.state}, {addr.pincode}
                    </div>
                    <div className="text-sm text-gray-500">{addr.country}</div>
                    <div className="text-sm text-gray-500 mt-1">{addr.phone}</div>
                    {addr.isDefault && (
                      <span className="inline-block mt-2 text-xs text-green-600 font-medium">
                        Default Address
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 text-center rounded-lg">
            <p className="text-gray-600">You have no saved addresses.</p>
            <p className="text-gray-500 text-sm mt-1">
              Please add a new address to continue with checkout.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
          <Link 
            href="/account/address/new?returnUrl=/checkout/address" 
            className="text-black hover:text-gray-700 font-medium flex items-center text-sm transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add new address
          </Link>
          <button 
            type="submit" 
            className="bg-black text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 transition"
            disabled={addresses.length === 0}
          >
            Continue to Shipping
          </button>
        </div>
      </form>
    </div>
  );
} 