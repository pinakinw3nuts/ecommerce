'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function CheckoutSuccessPage() {
  // When the component mounts, scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-6 py-16">
      <Card className="border-none shadow-none">
        <CardContent className="flex flex-col items-center text-center p-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
          
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Thank you for your purchase. Your order has been received.
          </p>
          
          <div className="w-full max-w-md bg-neutral-50 dark:bg-neutral-900 p-6 rounded-lg mb-8">
            <h2 className="font-semibold text-lg mb-4">Order Details</h2>
            
            <div className="flex justify-between py-2 border-b">
              <span>Order number:</span>
              <span className="font-medium">#ORD-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span>Order date:</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span>Shipping method:</span>
              <span className="font-medium">Standard Shipping</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span>Estimated delivery:</span>
              <span className="font-medium">
                {(() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 5);
                  return date.toLocaleDateString();
                })()}
              </span>
            </div>
          </div>
          
          <p className="mb-8">
            We've sent a confirmation email to your email address with the order details.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button asChild className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900">
              <Link href="/account/orders">
                View Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild className="flex-1 bg-neutral-900 hover:bg-neutral-800">
              <Link href="/products">
                Continue Shopping
                <ShoppingBag className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 