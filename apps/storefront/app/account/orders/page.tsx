'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

type OrderSummary = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // For demo purposes, we'll fetch without authentication
        const response = await axios.get('/api/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Set empty array in case of error
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="p-4">Loading your orders...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">Your Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-600">You have no past orders.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Order #{order.id}</div>
                  <div className="text-sm text-gray-500">Placed: {new Date(order.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-600">Status: {order.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${order.total.toFixed(2)}</div>
                  <Link href={`/account/orders/${order.id}`} className="text-sm underline text-blue-600">
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 