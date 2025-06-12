'use client';

import './config.js';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, MapPin, Package, Truck, ChevronDown, Tag } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import CouponForm from '@/components/coupon/CouponForm';
import AppliedCoupon from '@/components/coupon/AppliedCoupon';
import * as checkoutService from '@/services/checkout';
import { useToast } from '@/components/ui/Toast';
import toast from 'react-hot-toast';

// Simple Label component
function Label({ htmlFor, children, className = "" }: { 
  htmlFor?: string; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </label>
  );
}

// Simple RadioButton component
function RadioButton({ id, label, sublabel, value, checked, price, onChange }: {
  id: string;
  label: string;
  sublabel?: string;
  value: string;
  checked: boolean;
  price?: number | string;
  onChange: (value: any) => void;
}) {
  return (
    <div 
      className="flex items-center space-x-3 border p-4 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
      onClick={() => onChange(value)}
    >
      <div className="flex items-center h-4 w-4">
        <input
          type="radio"
          id={id}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="sr-only"
        />
        <div className={`h-4 w-4 rounded-full border ${checked ? 'border-neutral-900 bg-neutral-900 dark:bg-white' : 'border-neutral-300 dark:border-neutral-700'} relative`}>
          {checked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white dark:bg-neutral-900" />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex justify-between items-center">
        <div>
          <div className="font-medium">{label}</div>
          {sublabel && <div className="text-sm text-muted-foreground">{sublabel}</div>}
        </div>
        {price !== undefined && (
          <div>{typeof price === 'string' ? price : formatPrice(price)}</div>
        )}
      </div>
    </div>
  );
}

// Form data and error types
type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type FormErrors = Partial<FormData>;

type Address = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { 
    items, 
    subtotal, 
    shipping, 
    tax, 
    total, 
    clearCart, 
    coupon,
    discount,
    applyCoupon,
    removeCoupon 
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL'>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'paypal' | 'applepay'>('credit');
  const [shippingOptions, setShippingOptions] = useState<checkoutService.ShippingOption[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [orderPreview, setOrderPreview] = useState<checkoutService.OrderPreview | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '9876543210',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
    },
  ]);
  
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // If country or zipCode changes, fetch shipping options
    if (name === 'country' || name === 'zipCode') {
      fetchShippingOptions();
    }
  };
  
  // Fetch shipping options when address is complete
  const fetchShippingOptions = async () => {
    // Check if we have enough address data to fetch shipping options
    if (!formData.country || !formData.zipCode) {
      return;
    }
    
    try {
      setIsLoadingShipping(true);
      
      const address: checkoutService.Address = {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };
      
      const options = await checkoutService.getShippingOptions(address);
      setShippingOptions(options);
      
      // Set default shipping method if we have options
      if (options.length > 0) {
        setShippingMethod(options[0].method);
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      toast.error('Failed to fetch shipping options. Please check your address.');
    } finally {
      setIsLoadingShipping(false);
    }
  };
  
  // Calculate order preview when items, shipping method, or coupon changes
  const calculateOrderPreview = async () => {
    if (items.length === 0) return;
    
    try {
      // Convert cart items to checkout service format
      const cartItems: checkoutService.CartItem[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        metadata: {
          imageUrl: item.imageUrl,
          variant: item.variant,
          sku: item.sku,
        }
      }));
      
      // Create address object if we have address data
      let shippingAddress: checkoutService.Address | undefined;
      if (formData.address && formData.city && formData.state && formData.zipCode && formData.country) {
        shippingAddress = {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        };
      }
      
      // Use a valid UUID format for userId
      const userId = 'cc0c7021-e693-412e-9549-6c80ef327e39'; // In a real app, get this from authentication
      
      const preview = await checkoutService.calculateOrderPreview(
        userId,
        cartItems,
        coupon?.code,
        shippingAddress
      );
      
      setOrderPreview(preview);
    } catch (error) {
      console.error('Error calculating order preview:', error);
      toast.error('Failed to calculate order preview. Please try again.');
    }
  };
  
  // Fetch order preview when relevant data changes
  useEffect(() => {
    calculateOrderPreview();
  }, [items, shippingMethod, coupon]);
  
  // Handle shipping method change
  const handleShippingMethodChange = (method: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL') => {
    setShippingMethod(method);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert cart items to checkout service format
      const cartItems: checkoutService.CartItem[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        metadata: {
          imageUrl: item.imageUrl,
          variant: item.variant,
          sku: item.sku,
        }
      }));
      
      // Create address objects
      const shippingAddress: checkoutService.Address = {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };
      
      // Use shipping address as billing address for now
      const billingAddress = shippingAddress;
      
      // Use a valid UUID format for userId
      const userId = 'cc0c7021-e693-412e-9549-6c80ef327e39'; // In a real app, get this from authentication
      
      // Create checkout session using the service
      const session = await checkoutService.createCheckoutSession(
        userId,
        cartItems,
        coupon?.code,
        shippingAddress,
        billingAddress
      );
      
      setCheckoutSessionId(session.id);
      
      // In a real app, you would redirect to payment processing
      // For now, simulate payment and complete the session
      const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;
      
      // Complete the checkout session
      const completedSession = await checkoutService.completeCheckoutSession(session.id, paymentIntentId);
      
      // Clear cart and redirect to success page
      clearCart();
      router.push(`/checkout/success?sessionId=${session.id}`);
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error(error.message || 'Failed to process your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors: FormErrors = {};
    let isValid = true;
    
    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = "First name is required";
      isValid = false;
    }
    
    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = "Last name is required";
      isValid = false;
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Valid email is required";
      isValid = false;
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      errors.phone = "Phone number must be at least 10 characters";
      isValid = false;
    }
    
    if (!formData.address || formData.address.length < 5) {
      errors.address = "Address is required";
      isValid = false;
    }
    
    if (!formData.city || formData.city.length < 2) {
      errors.city = "City is required";
      isValid = false;
    }
    
    if (!formData.state || formData.state.length < 2) {
      errors.state = "State is required";
      isValid = false;
    }
    
    if (!formData.zipCode || formData.zipCode.length < 5) {
      errors.zipCode = "Zip code is required";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Function to select an address
  const selectAddress = (address: Address) => {
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: 'US',
    });
    setSelectedAddressId(address.id);
    setShowAddressDropdown(false);
    // Clear any form errors when selecting an address
    setFormErrors({});
  };
  
  // Calculate shipping cost based on method
  const shippingCost = shippingMethod === 'STANDARD' ? shipping :
                      shippingMethod === 'EXPRESS' ? shipping + 10 :
                      shipping + 20;

  // Calculate final total
  const finalTotal = subtotal - discount + shippingCost + tax;
  
  if (items.length === 0) {
    return (
      <div className="container max-w-6xl mx-auto px-6 py-12">
        <Card className="flex flex-col items-center justify-center p-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">You don't have any items in your cart to checkout.</p>
          <Button 
            onClick={() => router.push('/products')}
            className="bg-neutral-900 hover:bg-neutral-800"
          >
            Browse Products
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Shipping Address</h2>
                {savedAddresses.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                    >
                      {selectedAddressId ? 'Change Address' : 'Select Saved Address'}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    
                    {showAddressDropdown && (
                      <div className="absolute right-0 z-10 mt-1 w-72 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {savedAddresses.map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              className={`block w-full px-4 py-2 text-left text-sm ${
                                selectedAddressId === address.id ? 'bg-gray-100' : ''
                              }`}
                              onClick={() => selectAddress(address)}
                            >
                              <div className="font-medium">{address.firstName} {address.lastName}</div>
                              <div className="text-gray-500 text-xs">{address.address}, {address.city}, {address.state} {address.zipCode}</div>
                            </button>
                          ))}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              type="button"
                              className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setFormData({
                                  firstName: '',
                                  lastName: '',
                                  email: '',
                                  phone: '',
                                  address: '',
                                  city: '',
                                  state: '',
                                  zipCode: '',
                                  country: 'US',
                                });
                                setSelectedAddressId(null);
                                setShowAddressDropdown(false);
                              }}
                            >
                              + Add new address
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={formErrors.firstName ? "border-red-500" : ""}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={formErrors.lastName ? "border-red-500" : ""}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500">{formErrors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? "border-red-500" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input 
                    id="address" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={formErrors.address ? "border-red-500" : ""}
                  />
                  {formErrors.address && (
                    <p className="text-sm text-red-500">{formErrors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={formErrors.city ? "border-red-500" : ""}
                    />
                    {formErrors.city && (
                      <p className="text-sm text-red-500">{formErrors.city}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={formErrors.state ? "border-red-500" : ""}
                    />
                    {formErrors.state && (
                      <p className="text-sm text-red-500">{formErrors.state}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input 
                      id="zipCode" 
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={formErrors.zipCode ? "border-red-500" : ""}
                    />
                    {formErrors.zipCode && (
                      <p className="text-sm text-red-500">{formErrors.zipCode}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Shipping Method */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Shipping Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RadioButton
                  id="standard"
                  value="STANDARD"
                  label="Standard Shipping"
                  sublabel="Delivery in 3-5 business days"
                  checked={shippingMethod === 'STANDARD'}
                  price={shipping === 0 ? "Free" : shipping}
                  onChange={(val) => setShippingMethod(val as 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL')}
                />
                
                <RadioButton
                  id="express"
                  value="EXPRESS"
                  label="Express Shipping"
                  sublabel="Delivery in 2-3 business days"
                  checked={shippingMethod === 'EXPRESS'}
                  price={shipping + 10}
                  onChange={(val) => setShippingMethod(val as 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL')}
                />
                
                <RadioButton
                  id="overnight"
                  value="OVERNIGHT"
                  label="Next Day Delivery"
                  sublabel="Delivery tomorrow if ordered before 2pm"
                  checked={shippingMethod === 'OVERNIGHT'}
                  price={shipping + 20}
                  onChange={(val) => setShippingMethod(val as 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'INTERNATIONAL')}
                />
              </CardContent>
            </Card>
            
            {/* Payment Method */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <RadioButton
                    id="credit"
                    value="credit"
                    label="Credit Card"
                    checked={paymentMethod === 'credit'}
                    onChange={(val) => setPaymentMethod(val as 'credit' | 'paypal' | 'applepay')}
                  />
                  
                  <RadioButton
                    id="paypal"
                    value="paypal"
                    label="PayPal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(val) => setPaymentMethod(val as 'credit' | 'paypal' | 'applepay')}
                  />
                  
                  <RadioButton
                    id="applepay"
                    value="applepay"
                    label="Apple Pay"
                    checked={paymentMethod === 'applepay'}
                    onChange={(val) => setPaymentMethod(val as 'credit' | 'paypal' | 'applepay')}
                  />
                </div>
                
                {paymentMethod === 'credit' && (
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber" 
                        placeholder="0000 0000 0000 0000" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input 
                          id="expiryDate" 
                          placeholder="MM / YY" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input 
                          id="cvc" 
                          placeholder="CVC" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Mobile Order Summary - Shown on small screens */}
            <div className="lg:hidden">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between py-2">
                        <div className="flex gap-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.variant && (
                              <span className="text-sm text-muted-foreground block">
                                {item.variant}
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground block">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Coupon section for mobile */}
                  {coupon && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-[#D23F57]" />
                        Applied Discount
                      </h4>
                      <AppliedCoupon
                        coupon={coupon}
                        compact
                      />
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium text-lg">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#D23F57] hover:bg-[#b8354a] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>Place Order • {formatPrice(finalTotal)}</>
              )}
            </Button>
          </form>
        </div>
        
        {/* Order Summary (Right Column) - Sticky on large screens */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2">
                      <div className="flex gap-2">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.variant && (
                            <span className="text-sm text-muted-foreground block">
                              {item.variant}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground block">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Coupon section for desktop */}
                {coupon && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-[#D23F57]" />
                      Applied Discount
                    </h4>
                    <AppliedCoupon
                      coupon={coupon}
                      compact
                    />
                  </div>
                )}
                
                {!coupon && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-[#D23F57]" />
                      Add Coupon
                    </h4>
                    <CouponForm
                      orderTotal={subtotal}
                      onApply={applyCoupon}
                      compact
                    />
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-medium text-lg">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
                
                <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Your order will be securely processed. All payment information is encrypted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 