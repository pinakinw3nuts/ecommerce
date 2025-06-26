'use client';

import { Users, ShoppingCart, DollarSign, Package, Clock } from 'lucide-react';
import useSWR from 'swr';
import StatsCard from '@/components/StatsCard';
import Chart from '@/components/Chart';

interface DashboardMetrics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  usersTrend: number;
  ordersTrend: number;
  revenueTrend: number;
  productsTrend: number;
}

interface OrderTrend {
  date: string;
  orders: number;
}

interface ActivityLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  orderTrends: OrderTrend[];
  recentLogs: ActivityLog[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardData>('/api/dashboard/metrics', fetcher);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  const { metrics, orderTrends, recentLogs } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid - Responsive with 1 column on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          changePct={metrics.usersTrend}
          color="blue"
        />
        
        <StatsCard
          label="Total Orders"
          value={metrics.totalOrders}
          icon={ShoppingCart}
          changePct={metrics.ordersTrend}
          color="green"
        />
        
        <StatsCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          changePct={metrics.revenueTrend}
          color="yellow"
        />
        
        <StatsCard
          label="Total Products"
          value={metrics.totalProducts}
          icon={Package}
          changePct={metrics.productsTrend}
          color="red"
        />
      </div>

      {/* Chart - Full width with responsive height */}
      <div className="h-[300px] sm:h-[350px] md:h-[400px]">
        <Chart data={orderTrends} title="Order Trends - Last 7 Days" />
      </div>

      {/* Recent Logs - Responsive card layout */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentLogs.length === 0 ? (
            <div className="px-4 sm:px-6 py-4 text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            recentLogs.map((log: ActivityLog) => (
              <div key={log.id} className="px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="mt-0.5 sm:mt-0">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{log.details}</p>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0 ml-8 sm:ml-0">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
