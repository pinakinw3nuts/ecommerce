'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export default function OrderDetails() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // For demo purposes, we'll fetch without authentication
        const response = await axios.get(`/api/orders/${params.id}`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-4">Loading order details...</div>;
  }

  if (error || !order) {
    return <div className="p-4">Order not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Order #{order.id}</h1>
      <p className="text-sm text-gray-600 mb-6">Status: {order.status}</p>

      <div className="space-y-4 border-t pt-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 border-b pb-2">
            <img src={item.image} className="w-16 h-16 rounded" alt={item.name} />
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-sm text-gray-500">
                ${item.price} × {item.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-right mt-6 text-lg font-semibold">
        Total: ${order.total.toFixed(2)}
      </div>
    </div>
  );
} 