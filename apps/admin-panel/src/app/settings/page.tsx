'use client';

import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { SettingsContent } from '@/components/settings/SettingsContent';

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
  const [activeTab, setActiveTab] = useState('general');
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-7 w-7 text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[100px]"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <SettingsTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div className="p-6">
          <SettingsContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
} 