import { useState } from 'react';
import { 
  Settings, 
  Package, 
  ShoppingBag, 
  Truck, 
  CreditCard,
  Calculator,
  Users,
  Mail,
  Share2,
  Wrench
} from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'general', name: 'General', icon: Settings },
  { id: 'products', name: 'Products', icon: Package },
  { id: 'orders', name: 'Orders', icon: ShoppingBag },
  { id: 'shipping', name: 'Shipping', icon: Truck },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'tax', name: 'Tax', icon: Calculator },
  { id: 'customers', name: 'Customers', icon: Users },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'integration', name: 'Integration', icon: Share2 },
  { id: 'advanced', name: 'Advanced', icon: Wrench },
];

interface SettingsTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex flex-wrap gap-4 px-4" aria-label="Settings tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
              `}
            >
              <Icon className="h-5 w-5" />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
} 