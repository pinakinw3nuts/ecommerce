import { NextResponse } from 'next/server';

// Mock data generator functions
function generateTrendPercentage(): number {
  return Number((Math.random() * 30 - 10).toFixed(1)); // Random number between -10 and +20
}

function generateOrderTrends() {
  const trends = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    trends.push({
      date: date.toISOString().split('T')[0],
      orders: Math.floor(Math.random() * 40 + 30), // Random number between 30-70
    });
  }
  
  return trends;
}

function generateRecentLogs() {
  const actions = [
    'Product Update',
    'New Order',
    'User Registration',
    'Payment Received',
    'Inventory Update',
  ];
  
  const logs = [];
  const now = Date.now();
  
  for (let i = 0; i < 5; i++) {
    logs.push({
      id: i + 1,
      action: actions[i],
      user: 'Admin User',
      timestamp: new Date(now - i * 3600000).toISOString(), // Each log 1 hour apart
      details: `Updated inventory for Product XYZ`,
    });
  }
  
  return logs;
}

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData = {
    metrics: {
      totalUsers: 1482,
      totalOrders: 572,
      totalRevenue: 98342,
      totalProducts: 217,
      usersTrend: generateTrendPercentage(),
      ordersTrend: generateTrendPercentage(),
      revenueTrend: generateTrendPercentage(),
      productsTrend: generateTrendPercentage(),
    },
    orderTrends: generateOrderTrends(),
    recentLogs: generateRecentLogs(),
  };

  return NextResponse.json(mockData);
} 