'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Mail, Globe2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

// Mock data - will be replaced with API calls
const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

export default function SettingsPage() {
  const [taxRate, setTaxRate] = useState('10');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Platform Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Tax Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">Tax Configuration</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700">
                Default Tax Rate (%)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter tax rate"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This rate will be applied to all applicable products
              </p>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Currency Settings</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700">
                Platform Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                All prices will be displayed in this currency
              </p>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Language Settings</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700">
                Platform Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Default language for the admin interface
              </p>
            </div>
          </div>
        </div>

        {/* Email Settings (Future) */}
        <div className="rounded-lg border border-gray-200 bg-white opacity-75">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">Email Settings</h2>
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Coming Soon
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="smtp.example.com"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="587"
                  disabled
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="username@example.com"
                  disabled
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Email configuration will be available in a future update
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 