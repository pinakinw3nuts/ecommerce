export interface ShippingMethod {
  method: string;
  label: string;
  description: string;
  price: number;
  estimatedDays: number;
}

export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    method: 'standard',
    label: 'Standard Shipping',
    description: 'Delivery in 5-7 business days',
    price: 5.99,
    estimatedDays: 7
  },
  {
    method: 'express',
    label: 'Express Shipping',
    description: 'Delivery in 2-3 business days',
    price: 14.99,
    estimatedDays: 3
  },
  {
    method: 'overnight',
    label: 'Overnight Shipping',
    description: 'Next day delivery',
    price: 29.99,
    estimatedDays: 1
  }
];
