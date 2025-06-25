'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Truck, Globe, BadgeDollarSign } from 'lucide-react';

const shippingSections = [
  {
    title: 'Shipping Methods',
    description: 'Manage how you ship your orders.',
    href: '/shipping/methods',
    icon: <Truck className="h-8 w-8 text-gray-500" />,
  },
  {
    title: 'Shipping Zones',
    description: 'Define shipping regions and countries.',
    href: '/shipping/zones',
    icon: <Globe className="h-8 w-8 text-gray-500" />,
  },
  {
    title: 'Shipping Rates',
    description: 'Set prices for your shipping methods and zones.',
    href: '/shipping/rates',
    icon: <BadgeDollarSign className="h-8 w-8 text-gray-500" />,
  },
];

export default function ShippingPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Shipping Management</h1>
      <p className="text-gray-600 mb-8">
        Configure your shipping settings, including methods, zones, and rates to provide clear shipping options for your customers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shippingSections.map((section) => (
          <Card
            key={section.title}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(section.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{section.title}</CardTitle>
              {section.icon}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{section.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 