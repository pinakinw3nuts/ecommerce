import { redirect } from 'next/navigation';

type PaymentMethod = {
  id: string;
  name: string;
  type: string; // e.g. 'COD', 'Stripe'
  label: string;
};

type Props = {
  searchParams: {
    addressId?: string;
    shippingId?: string;
  };
};

// Mock payment methods for demonstration
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Cash on Delivery",
    type: "Pay when you receive",
    label: "Cash on Delivery"
  },
  {
    id: "stripe",
    name: "Credit/Debit Card",
    type: "Pay securely online",
    label: "Credit/Debit Card"
  }
];

export default function PaymentPage({ searchParams }: Props) {
  const { addressId, shippingId } = searchParams;

  if (!addressId || !shippingId) redirect('/checkout/address');

  const methods = mockPaymentMethods;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Payment Method</h1>

      <form action="/checkout/review" method="GET" className="space-y-6">
        <input type="hidden" name="addressId" value={addressId} />
        <input type="hidden" name="shippingId" value={shippingId} />

        {methods.map((method) => (
          <label key={method.id} className="block border p-4 rounded hover:shadow">
            <input
              type="radio"
              name="paymentId"
              value={method.id}
              required
              className="mr-2"
            />
            <span className="font-medium">{method.label}</span>
            <div className="text-sm text-gray-500">{method.type}</div>
          </label>
        ))}

        <div className="pt-6 flex justify-end">
          <button type="submit" className="bg-black text-white px-6 py-2 rounded">
            Review Order
          </button>
        </div>
      </form>
    </div>
  );
} 