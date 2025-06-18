import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MapPin, ChevronDown } from 'lucide-react';
import { useCheckout } from './CheckoutProvider';
import * as checkoutService from '@/services/checkout';
import * as shippingService from '@/services/shipping';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

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

// Adjusted Address type to match what might be returned by the shipping service
type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  landmark?: string;
  isDefault?: boolean;
  additionalInfo?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

interface ShippingAddressFormProps {
  // No props needed, using context for navigation
}

export const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ }) => {
  const { shippingAddress, setShippingAddress, calculateOrderPreview, nextStep, checkoutSession, setCheckoutSession } = useCheckout();
  const { user } = useAuth();
  const { items } = useCart();
  const [formData, setFormData] = useState<FormData>({
    firstName: shippingAddress?.firstName || '',
    lastName: shippingAddress?.lastName || '',
    email: shippingAddress?.email || '',
    phone: shippingAddress?.phone || '',
    address: shippingAddress?.street || '',
    city: shippingAddress?.city || '',
    state: shippingAddress?.state || '',
    zipCode: shippingAddress?.zipCode || '',
    country: shippingAddress?.country || 'US',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  useEffect(() => {
    // Initialize form data from shippingAddress if available
    setFormData({
      firstName: shippingAddress?.firstName || '',
      lastName: shippingAddress?.lastName || '',
      email: shippingAddress?.email || user?.email || '',
      phone: shippingAddress?.phone || '',
      address: shippingAddress?.street || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      zipCode: shippingAddress?.zipCode || '',
      country: shippingAddress?.country || 'US',
    });
  }, [shippingAddress, user?.email]);

  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        const addresses: SavedAddress[] = await shippingService.fetchUserAddresses();
        console.log('Fetched addresses:', addresses);
        setSavedAddresses(addresses);
      } catch (error) {
        console.error('Error fetching saved addresses:', error);
        // Don't show error toast here since it's handled in the service
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    if (user?.id) {
      fetchAddresses();
    }
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const selectAddress = (address: SavedAddress) => {
    setFormData({
      firstName: address.fullName.split(' ')[0] || '',
      lastName: address.fullName.split(' ').slice(1).join(' ') || '',
      email: shippingAddress?.email || '',
      phone: address.phone || '',
      address: address.addressLine1 || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.pincode || '',
      country: address.country || '',
    });
    setSelectedAddressId(address.id);
    setShowAddressDropdown(false);
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.firstName) errors.firstName = 'First Name is required';
    if (!formData.lastName) errors.lastName = 'Last Name is required';
    if (!formData.email) errors.email = 'Email is required';
    else {
      const emailToValidate = formData.email.trim();
      console.log('Validating email:', emailToValidate);
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailToValidate)) errors.email = 'Invalid email format';
    }
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.zipCode) errors.zipCode = 'Zip Code is required';
    if (!formData.country) errors.country = 'Country is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        if (!checkoutSession?.id || !user?.id) {
          toast.error('Checkout session or user ID is missing. Please refresh the page.');
          return;
        }

        const address: checkoutService.Address = {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        };
        setShippingAddress(address);
        console.log('Shipping Address set in CheckoutContext:', address);

        // Update checkout session on the backend
        const updatedSessionResponse = await checkoutService.updateShippingAddress(checkoutSession.id, address);
        setCheckoutSession(updatedSessionResponse);
        toast.success('Shipping address saved.');

        // Recalculate order preview after setting shipping address
        await calculateOrderPreview(user.id, items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, name: item.name })));

        nextStep();
      } catch (error) {
        toast.error('Error saving shipping address.');
        console.error('Error saving shipping address:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {isLoadingAddresses ? (
            <p>Loading saved addresses...</p>
          ) : savedAddresses.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                className="w-full justify-between pr-3"
                type="button"
                onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              >
                {selectedAddressId
                  ? savedAddresses.find((addr) => addr.id === selectedAddressId)?.fullName || "Select a saved address"
                  : "Select a saved address"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              {showAddressDropdown && (
                <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm"
                      onClick={() => selectAddress(addr)}
                    >
                      <p className="font-medium">{addr.fullName}</p>
                      <p className="text-muted-foreground">{addr.addressLine1}, {addr.city}, {addr.state} {addr.pincode}</p>
                    </div>
                  ))}
                  <div
                    className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer text-sm text-blue-600 font-medium"
                    onClick={() => {
                      setSelectedAddressId(null);
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
                      setShowAddressDropdown(false);
                    }}
                  >
                    + Add New Address
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                className={formErrors.firstName ? 'border-red-500' : ''}
              />
              {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
                className={formErrors.lastName ? 'border-red-500' : ''}
              />
              {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@example.com"
              className={formErrors.email ? 'border-red-500' : ''}
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">Phone</label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
              className={formErrors.phone ? 'border-red-500' : ''}
            />
            {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
          </div>
          <div>
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Main St"
              className={formErrors.address ? 'border-red-500' : ''}
            />
            {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="New York"
                className={formErrors.city ? 'border-red-500' : ''}
              />
              {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
            </div>
            <div>
              <label htmlFor="state" className="text-sm font-medium">State / Province</label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="NY"
                className={formErrors.state ? 'border-red-500' : ''}
              />
              {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
            </div>
            <div>
              <label htmlFor="zipCode" className="text-sm font-medium">Zip / Postal Code</label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                placeholder="10001"
                className={formErrors.zipCode ? 'border-red-500' : ''}
              />
              {formErrors.zipCode && <p className="text-red-500 text-xs mt-1">{formErrors.zipCode}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="country" className="text-sm font-medium">Country</label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="US"
              className={formErrors.country ? 'border-red-500' : ''}
            />
            {formErrors.country && <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>}
          </div>
          <Button type="submit" className="w-full">
            Continue to Shipping
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};