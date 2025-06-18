'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as shippingService from '@/services/shipping';
import { SavedAddress, AddressInput } from '@/services/shipping';
import toast from 'react-hot-toast';

export type UISavedAddress = {
  id: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
  type?: string;
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<UISavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  console.log("addresses page ==>", addresses);
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const response = await shippingService.fetchUserAddresses();
        
        if (response && Array.isArray(response)) {
          setAddresses(
            response.map(addr => ({
              ...addr,
              name: addr.fullName,
              line1: addr.addressLine1,
              line2: addr.addressLine2,
              type: (addr as any).type || 'shipping',
            }))
          );
        } else {
          setAddresses([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching addresses:', err);
        setError('Failed to load addresses. Please try again.');
        toast.error('Failed to load addresses.');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handleEdit = (addr: UISavedAddress) => {
    window.location.href = `/account/address/edit/${addr.id}`;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setIsSubmitting(true);
      try {
        await shippingService.deleteAddress(id);
        setAddresses(addresses.filter(addr => addr.id !== id));
        toast.success('Address deleted successfully.');
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete address. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsSubmitting(true);
    try {
      await shippingService.setDefaultAddress(id);
      
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
      toast.success('Default address set successfully.');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Your Addresses</h1>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Your Addresses</h1>
          <Link 
            href="/account/address/new" 
            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            Add New Address
          </Link>
        </div>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Your Addresses</h1>
        <Link 
          href="/account/address/new" 
          className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
        >
          Add New Address
        </Link>
      </div>

      {isSubmitting ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h3 className="text-lg font-medium text-gray-700">No addresses found</h3>
          <p className="text-gray-500 mt-2">Add your first address to make checkout faster</p>
          <Link 
            href="/account/address/new" 
            className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            Add Address
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`border rounded-lg p-4 relative ${addr.isDefault ? 'border-black shadow-sm' : 'border-gray-200'}`}
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-4 bg-black text-white text-xs px-2 py-1 rounded">
                  Default
                </span>
              )}
              
              <div className="flex items-center mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                  {addr.type}
                </span>
              </div>
              
              <div className="font-medium text-gray-900">{addr.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {addr.line1}
                {addr.line2 && <>, {addr.line2}</>}
              </div>
              <div className="text-sm text-gray-500">
                {addr.city}, {addr.state}, {addr.pincode}
              </div>
              <div className="text-sm text-gray-500">{addr.country}</div>
              <div className="text-sm text-gray-500 mt-1">{addr.phone}</div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                <button 
                  onClick={() => handleEdit(addr)} 
                  className="text-sm text-gray-700 hover:text-black transition"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)} 
                  className="text-sm text-red-600 hover:text-red-700 transition"
                >
                  Delete
                </button>
                {!addr.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(addr.id)} 
                    className="text-sm text-blue-600 hover:text-blue-700 transition ml-auto"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 