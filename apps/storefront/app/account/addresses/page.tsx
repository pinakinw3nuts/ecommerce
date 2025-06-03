'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

type Address = {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
};

// Mock addresses for demonstration
const mockAddresses: Address[] = [
  {
    id: "addr1",
    type: "home",
    name: "John Doe",
    phone: "+1 (555) 123-4567",
    line1: "123 Main Street",
    line2: "Apt 4B",
    city: "New York",
    state: "NY",
    country: "United States",
    pincode: "10001",
    isDefault: true
  },
  {
    id: "addr2",
    type: "work",
    name: "John Doe",
    phone: "+1 (555) 987-6543",
    line1: "456 Park Avenue",
    city: "Boston",
    state: "MA",
    country: "United States",
    pincode: "02108"
  }
];

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (addr: Address) => {
    // In a real app, we would navigate to an edit page or open a modal
    alert(`Edit address functionality would open a form for address ID: ${addr.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setLoading(true);
      try {
        // In a real implementation, we would make an API call
        // await axios.delete(`/api/addresses/${id}`);
        
        // For demo, just remove from state
        setAddresses(addresses.filter(addr => addr.id !== id));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      // In a real implementation, we would make an API call
      // await axios.patch(`/api/addresses/${id}/default`);
      
      // For demo, update the state
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      })));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

      {loading ? (
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