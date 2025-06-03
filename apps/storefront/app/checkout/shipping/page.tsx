import { redirect } from 'next/navigation';

type ShippingMethod = {
  id: string;
  name: string;
  rate: number;
  estimatedDays: number;
};

type Props = {
  searchParams: {
    addressId?: string;
  };
};

// Mock shipping options for demonstration
const mockShippingOptions: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    rate: 4.99,
    estimatedDays: 5
  },
  {
    id: "express",
    name: "Express Shipping",
    rate: 12.99,
    estimatedDays: 2
  }
];

export default function ShippingPage({ searchParams }: Props) {
  const addressId = searchParams?.addressId;
  if (!addressId) redirect('/checkout/address');

  const options = mockShippingOptions;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Shipping Method</h1>

      <form action="/checkout/payment" method="GET" className="space-y-6">
        <input type="hidden" name="addressId" value={addressId} />

        {options.map((option) => (
          <label key={option.id} className="block border p-4 rounded hover:shadow">
            <input
              type="radio"
              name="shippingId"
              value={option.id}
              required
              className="mr-2"
            />
            <span className="font-medium">{option.name}</span>
            <div className="text-sm text-gray-500">
              ${option.rate.toFixed(2)} – Est. {option.estimatedDays} days
            </div>
          </label>
        ))}

        <div className="pt-6 flex justify-end">
          <button type="submit" className="bg-black text-white px-6 py-2 rounded">
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
} 