'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as shippingService from '@/services/shipping';
import { AddressInput } from '@/services/shipping';
import toast from 'react-hot-toast';

export default function NewAddressPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    
    const addressData: AddressInput = {
      addressLine1: formData.get('addressLine1') as string,
      addressLine2: formData.get('addressLine2') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      pincode: formData.get('pincode') as string,
      country: formData.get('country') as string,
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      type: formData.get('type') as 'shipping' | 'billing' | 'both',
    };

    try {
      await shippingService.addShippingAddress(addressData);
      toast.success('Address added successfully!');
      
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(returnUrl || '/account/addresses');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Add New Address</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-1">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Address Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              >
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="col-span-1">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                placeholder="John Doe"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              placeholder="+1 (555) 123-4567"
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              id="addressLine1"
              name="addressLine1"
              required
              placeholder="123 Main St"
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2 <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="addressLine2"
              name="addressLine2"
              placeholder="Apt 4B, Floor 2, etc."
              className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                placeholder="New York"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                required
                placeholder="NY"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                required
                placeholder="United States"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>
            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal/ZIP Code
              </label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                required
                placeholder="10001"
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black transition"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200 mt-6 flex justify-between items-center">
            <Link 
              href="/account/addresses" 
              className="text-gray-600 hover:text-gray-800 font-medium text-sm transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 