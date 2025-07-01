'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PaymentService } from '@/services/payment.service';
import { PaymentMethodType } from '@/types/payment';

export default function NewPaymentMethodPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: PaymentMethodType.CARD,
    provider: 'stripe',
    userId: '',
    cardNumber: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cardCVC: '',
    cardHolderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    isDefault: false,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleGoBack = () => {
    router.push('/payments/methods');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === PaymentMethodType.CARD) {
      if (!formData.cardNumber || !formData.cardExpiryMonth || !formData.cardExpiryYear || !formData.cardCVC) {
        toast.error('Please fill all required card fields');
        return;
      }
    } else {
      if (!formData.bankName || !formData.accountNumber || !formData.routingNumber) {
        toast.error('Please fill all required bank account fields');
        return;
      }
    }
    
    setIsLoading(true);
    try {
      // In a real implementation, we'd send this data to the API
      // Here we'll simulate a successful response
      
      // Format the data for the API
      const paymentMethodData = {
        type: formData.type,
        provider: formData.provider,
        userId: formData.userId || 'current-user-id', // In a real app, this would be the current user
        isDefault: formData.isDefault,
        // For a real implementation, you would not send card details directly
        // Instead, you'd use a tokenization system from your payment provider
        card: formData.type === PaymentMethodType.CARD ? {
          number: formData.cardNumber,
          exp_month: parseInt(formData.cardExpiryMonth),
          exp_year: parseInt(formData.cardExpiryYear),
          cvc: formData.cardCVC,
          name: formData.cardHolderName
        } : undefined,
        bankAccount: formData.type === PaymentMethodType.BANK_ACCOUNT ? {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          routingNumber: formData.routingNumber,
          accountHolderName: formData.accountHolderName
        } : undefined
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, use the PaymentService
      // await PaymentService.createPaymentMethod(paymentMethodData);
      
      toast.success('Payment method added successfully');
      router.push('/payments/methods');
    } catch (error) {
      console.error('Failed to add payment method:', error);
      toast.error('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleGoBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-gray-600 mr-2" />
            <h1 className="text-2xl font-semibold">Add Payment Method</h1>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method Type*
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required
              >
                <option value={PaymentMethodType.CARD}>Credit/Debit Card</option>
                <option value={PaymentMethodType.BANK_ACCOUNT}>Bank Account</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Provider*
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required
              >
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="razorpay">Razorpay</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                placeholder="Leave blank to use current user"
                value={formData.userId}
                onChange={handleInputChange}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default payment method
                </label>
              </div>
            </div>
          </div>
          
          {formData.type === PaymentMethodType.CARD ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Card Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number*
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="•••• •••• •••• ••••"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="cardHolderName"
                    name="cardHolderName"
                    placeholder="John Doe"
                    value={formData.cardHolderName}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label htmlFor="cardExpiryMonth" className="block text-sm font-medium text-gray-700 mb-1">
                      Month*
                    </label>
                    <select
                      id="cardExpiryMonth"
                      name="cardExpiryMonth"
                      value={formData.cardExpiryMonth}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label htmlFor="cardExpiryYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Year*
                    </label>
                    <select
                      id="cardExpiryYear"
                      name="cardExpiryYear"
                      value={formData.cardExpiryYear}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-1">
                    <label htmlFor="cardCVC" className="block text-sm font-medium text-gray-700 mb-1">
                      CVC*
                    </label>
                    <input
                      type="text"
                      id="cardCVC"
                      name="cardCVC"
                      placeholder="•••"
                      value={formData.cardCVC}
                      onChange={handleInputChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      required
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium mb-4">Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name*
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    placeholder="Bank of America"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    id="accountHolderName"
                    name="accountHolderName"
                    placeholder="John Doe"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number*
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="••••••••••••"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Routing Number*
                  </label>
                  <input
                    type="text"
                    id="routingNumber"
                    name="routingNumber"
                    placeholder="•••••••••"
                    value={formData.routingNumber}
                    onChange={handleInputChange}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-5">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" /> Save Payment Method
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 