'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data: Array<{
    date: string;
    orders: number;
  }>;
  title: string;
}

export default function Chart({ data, title }: ChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device for responsive adjustments
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Format dates for mobile to be shorter
  const formattedData = data.map(item => ({
    ...item,
    // For mobile, show shorter date format
    formattedDate: isMobile 
      ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : item.date
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 md:p-6">
      <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>
      <div className="mt-3 sm:mt-6 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{
              top: 10,
              right: isMobile ? 10 : 30,
              left: isMobile ? -20 : 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={isMobile ? "formattedDate" : "date"} 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickMargin={8}
              interval={isMobile ? 1 : 0}
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickMargin={8}
              width={isMobile ? 30 : 40}
            />
            <Tooltip 
              contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              fill="#93c5fd"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 