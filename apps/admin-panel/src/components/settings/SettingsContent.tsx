import { GeneralSettings } from './tabs/GeneralSettings';
import { ProductSettings } from './tabs/ProductSettings';
import { OrderSettings } from './tabs/OrderSettings';
import { ShippingSettings } from './tabs/ShippingSettings';
import { PaymentSettings } from './tabs/PaymentSettings';
import { TaxSettings } from './tabs/TaxSettings';
import { CustomerSettings } from './tabs/CustomerSettings';
import { EmailSettings } from './tabs/EmailSettings';
import { IntegrationSettings } from './tabs/IntegrationSettings';
import { AdvancedSettings } from './tabs/AdvancedSettings';

interface SettingsContentProps {
  activeTab: string;
}

export function SettingsContent({ activeTab }: SettingsContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      
      case 'products':
        return <ProductSettings />;

      case 'orders':
        return <OrderSettings />;

      case 'shipping':
        return <ShippingSettings />;

      case 'payments':
        return <PaymentSettings />;

      case 'tax':
        return <TaxSettings />;

      case 'customers':
        return <CustomerSettings />;

      case 'email':
        return <EmailSettings />;

      case 'integration':
        return <IntegrationSettings />;

      case 'advanced':
        return <AdvancedSettings />;

      default:
        return (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">
              Settings for {activeTab} coming soon
            </p>
          </div>
        );
    }
  };

  return (
    <div className="py-6">
      {renderContent()}
    </div>
  );
} 