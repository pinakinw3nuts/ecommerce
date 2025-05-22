import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface GeneralSettingsData {
  // Store Information
  storeName: string;
  legalName: string;
  storeDescription: string;
  establishedDate: string;
  vatNumber: string;
  companyNumber: string;
  logo: string;
  favicon: string;

  // Contact Information
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  supportEmail: string;
  supportPhone: string;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialLinkedIn: string;

  // Localization
  defaultLanguage: string;
  availableLanguages: string[];
  defaultCurrency: string;
  availableCurrencies: string[];
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  firstDayOfWeek: string;
  weightUnit: string;
  dimensionUnit: string;

  // Store Preferences
  maintenanceMode: boolean;
  enableInventory: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableComparisons: boolean;
  showPricesWithTax: boolean;
  allowGuestCheckout: boolean;
  requireAccountForReviews: boolean;
  autoUpdateExchangeRates: boolean;
  showOutOfStockProducts: boolean;
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'AUD', label: 'Australian Dollar' },
  { value: 'CAD', label: 'Canadian Dollar' },
  { value: 'CHF', label: 'Swiss Franc' },
  { value: 'CNY', label: 'Chinese Yuan' },
];

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormatOptions = [
  { value: '12', label: '12-hour' },
  { value: '24', label: '24-hour' },
];

const weekDayOptions = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
];

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

const unitOptions = {
  weight: [
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'lb', label: 'Pounds (lb)' },
    { value: 'oz', label: 'Ounces (oz)' },
  ],
  dimension: [
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'm', label: 'Meters (m)' },
  ],
};

export function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettingsData>({
    // Store Information
    storeName: '',
    legalName: '',
    storeDescription: '',
    establishedDate: '',
    vatNumber: '',
    companyNumber: '',
    logo: '',
    favicon: '',

    // Contact Information
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    supportEmail: '',
    supportPhone: '',
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialLinkedIn: '',

    // Localization
    defaultLanguage: 'en',
    availableLanguages: ['en'],
    defaultCurrency: 'USD',
    availableCurrencies: ['USD'],
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    timezone: 'UTC',
    firstDayOfWeek: 'sunday',
    weightUnit: 'kg',
    dimensionUnit: 'cm',

    // Store Preferences
    maintenanceMode: false,
    enableInventory: true,
    enableReviews: true,
    enableWishlist: true,
    enableComparisons: true,
    showPricesWithTax: true,
    allowGuestCheckout: true,
    requireAccountForReviews: true,
    autoUpdateExchangeRates: true,
    showOutOfStockProducts: true,
  });

  const handleChange = (field: keyof GeneralSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Store Information */}
      <FormSection 
        title="Store Information" 
        description="Basic information about your store"
      >
        <FormRow
          label="Store Name"
          htmlFor="storeName"
          description="The name of your online store"
        >
          <FormInput
            id="storeName"
            value={settings.storeName}
            onChange={(e) => handleChange('storeName', e.target.value)}
            placeholder="My Awesome Store"
          />
        </FormRow>

        <FormRow
          label="Legal Name"
          htmlFor="legalName"
          description="Your company's legal business name"
        >
          <FormInput
            id="legalName"
            value={settings.legalName}
            onChange={(e) => handleChange('legalName', e.target.value)}
            placeholder="Company Legal Name Ltd."
          />
        </FormRow>

        <FormRow
          label="Store Description"
          htmlFor="storeDescription"
          description="Brief description of your store"
        >
          <FormTextarea
            id="storeDescription"
            value={settings.storeDescription}
            onChange={(e) => handleChange('storeDescription', e.target.value)}
            placeholder="Enter a brief description of your store..."
          />
        </FormRow>

        <FormRow
          label="Established Date"
          htmlFor="establishedDate"
          description="When your business was established"
        >
          <FormInput
            id="establishedDate"
            type="date"
            value={settings.establishedDate}
            onChange={(e) => handleChange('establishedDate', e.target.value)}
          />
        </FormRow>

        <FormRow
          label="VAT Number"
          htmlFor="vatNumber"
          description="Your VAT registration number"
        >
          <FormInput
            id="vatNumber"
            value={settings.vatNumber}
            onChange={(e) => handleChange('vatNumber', e.target.value)}
            placeholder="VAT Number"
          />
        </FormRow>

        <FormRow
          label="Company Number"
          htmlFor="companyNumber"
          description="Your company registration number"
        >
          <FormInput
            id="companyNumber"
            value={settings.companyNumber}
            onChange={(e) => handleChange('companyNumber', e.target.value)}
            placeholder="Company Number"
          />
        </FormRow>

        <FormRow
          label="Store Logo"
          htmlFor="logo"
          description="URL of your store logo"
        >
          <FormInput
            id="logo"
            value={settings.logo}
            onChange={(e) => handleChange('logo', e.target.value)}
            placeholder="https://..."
          />
        </FormRow>

        <FormRow
          label="Favicon"
          htmlFor="favicon"
          description="URL of your store favicon"
        >
          <FormInput
            id="favicon"
            value={settings.favicon}
            onChange={(e) => handleChange('favicon', e.target.value)}
            placeholder="https://..."
          />
        </FormRow>
      </FormSection>

      {/* Contact Information */}
      <FormSection 
        title="Contact Information" 
        description="Your store's contact details"
      >
        <FormRow
          label="Email"
          htmlFor="email"
          description="Primary contact email"
        >
          <FormInput
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@example.com"
          />
        </FormRow>

        <FormRow
          label="Phone"
          htmlFor="phone"
          description="Primary contact phone number"
        >
          <FormInput
            id="phone"
            type="tel"
            value={settings.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </FormRow>

        <FormRow
          label="Address Line 1"
          htmlFor="address1"
          description="Street address"
        >
          <FormInput
            id="address1"
            value={settings.address1}
            onChange={(e) => handleChange('address1', e.target.value)}
            placeholder="123 Store Street"
          />
        </FormRow>

        <FormRow
          label="Address Line 2"
          htmlFor="address2"
          description="Apartment, suite, unit, etc."
        >
          <FormInput
            id="address2"
            value={settings.address2}
            onChange={(e) => handleChange('address2', e.target.value)}
            placeholder="Suite 100"
          />
        </FormRow>

        <FormRow
          label="City"
          htmlFor="city"
          description="City name"
        >
          <FormInput
            id="city"
            value={settings.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="City"
          />
        </FormRow>

        <FormRow
          label="State/Province"
          htmlFor="state"
          description="State or province name"
        >
          <FormInput
            id="state"
            value={settings.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="State"
          />
        </FormRow>

        <FormRow
          label="Postal Code"
          htmlFor="postalCode"
          description="ZIP or postal code"
        >
          <FormInput
            id="postalCode"
            value={settings.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="12345"
          />
        </FormRow>

        <FormRow
          label="Country"
          htmlFor="country"
          description="Country name"
        >
          <FormInput
            id="country"
            value={settings.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Country"
          />
        </FormRow>

        <FormRow
          label="Support Email"
          htmlFor="supportEmail"
          description="Customer support email address"
        >
          <FormInput
            id="supportEmail"
            type="email"
            value={settings.supportEmail}
            onChange={(e) => handleChange('supportEmail', e.target.value)}
            placeholder="support@example.com"
          />
        </FormRow>

        <FormRow
          label="Support Phone"
          htmlFor="supportPhone"
          description="Customer support phone number"
        >
          <FormInput
            id="supportPhone"
            type="tel"
            value={settings.supportPhone}
            onChange={(e) => handleChange('supportPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </FormRow>

        <FormRow
          label="Facebook"
          htmlFor="socialFacebook"
          description="Facebook page URL"
        >
          <FormInput
            id="socialFacebook"
            value={settings.socialFacebook}
            onChange={(e) => handleChange('socialFacebook', e.target.value)}
            placeholder="https://facebook.com/..."
          />
        </FormRow>

        <FormRow
          label="Twitter"
          htmlFor="socialTwitter"
          description="Twitter profile URL"
        >
          <FormInput
            id="socialTwitter"
            value={settings.socialTwitter}
            onChange={(e) => handleChange('socialTwitter', e.target.value)}
            placeholder="https://twitter.com/..."
          />
        </FormRow>

        <FormRow
          label="Instagram"
          htmlFor="socialInstagram"
          description="Instagram profile URL"
        >
          <FormInput
            id="socialInstagram"
            value={settings.socialInstagram}
            onChange={(e) => handleChange('socialInstagram', e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </FormRow>

        <FormRow
          label="LinkedIn"
          htmlFor="socialLinkedIn"
          description="LinkedIn company page URL"
        >
          <FormInput
            id="socialLinkedIn"
            value={settings.socialLinkedIn}
            onChange={(e) => handleChange('socialLinkedIn', e.target.value)}
            placeholder="https://linkedin.com/company/..."
          />
        </FormRow>
      </FormSection>

      {/* Localization */}
      <FormSection 
        title="Localization" 
        description="Language and regional settings"
      >
        <FormRow
          label="Default Language"
          htmlFor="defaultLanguage"
          description="Primary language for your store"
        >
          <FormSelect
            id="defaultLanguage"
            value={settings.defaultLanguage}
            onChange={(e) => handleChange('defaultLanguage', e.target.value)}
            options={languageOptions}
          />
        </FormRow>

        <FormRow
          label="Default Currency"
          htmlFor="defaultCurrency"
          description="Primary currency for your store"
        >
          <FormSelect
            id="defaultCurrency"
            value={settings.defaultCurrency}
            onChange={(e) => handleChange('defaultCurrency', e.target.value)}
            options={currencyOptions}
          />
        </FormRow>

        <FormRow
          label="Date Format"
          htmlFor="dateFormat"
          description="How dates should be displayed"
        >
          <FormSelect
            id="dateFormat"
            value={settings.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            options={dateFormatOptions}
          />
        </FormRow>

        <FormRow
          label="Time Format"
          htmlFor="timeFormat"
          description="12 or 24-hour time format"
        >
          <FormSelect
            id="timeFormat"
            value={settings.timeFormat}
            onChange={(e) => handleChange('timeFormat', e.target.value)}
            options={timeFormatOptions}
          />
        </FormRow>

        <FormRow
          label="Timezone"
          htmlFor="timezone"
          description="Store's operating timezone"
        >
          <FormSelect
            id="timezone"
            value={settings.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            options={timezoneOptions}
          />
        </FormRow>

        <FormRow
          label="First Day of Week"
          htmlFor="firstDayOfWeek"
          description="First day of the week in your region"
        >
          <FormSelect
            id="firstDayOfWeek"
            value={settings.firstDayOfWeek}
            onChange={(e) => handleChange('firstDayOfWeek', e.target.value)}
            options={weekDayOptions}
          />
        </FormRow>

        <FormRow
          label="Weight Unit"
          htmlFor="weightUnit"
          description="Unit for product weights"
        >
          <FormSelect
            id="weightUnit"
            value={settings.weightUnit}
            onChange={(e) => handleChange('weightUnit', e.target.value)}
            options={unitOptions.weight}
          />
        </FormRow>

        <FormRow
          label="Dimension Unit"
          htmlFor="dimensionUnit"
          description="Unit for product dimensions"
        >
          <FormSelect
            id="dimensionUnit"
            value={settings.dimensionUnit}
            onChange={(e) => handleChange('dimensionUnit', e.target.value)}
            options={unitOptions.dimension}
          />
        </FormRow>
      </FormSection>

      {/* Store Preferences */}
      <FormSection 
        title="Store Preferences" 
        description="General store settings and features"
      >
        <FormRow
          label="Maintenance Mode"
          htmlFor="maintenanceMode"
          description="Enable maintenance mode"
        >
          <FormToggle
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Inventory"
          htmlFor="enableInventory"
          description="Track product inventory"
        >
          <FormToggle
            id="enableInventory"
            checked={settings.enableInventory}
            onChange={(e) => handleChange('enableInventory', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Reviews"
          htmlFor="enableReviews"
          description="Allow product reviews"
        >
          <FormToggle
            id="enableReviews"
            checked={settings.enableReviews}
            onChange={(e) => handleChange('enableReviews', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Wishlist"
          htmlFor="enableWishlist"
          description="Allow customer wishlists"
        >
          <FormToggle
            id="enableWishlist"
            checked={settings.enableWishlist}
            onChange={(e) => handleChange('enableWishlist', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Comparisons"
          htmlFor="enableComparisons"
          description="Allow product comparisons"
        >
          <FormToggle
            id="enableComparisons"
            checked={settings.enableComparisons}
            onChange={(e) => handleChange('enableComparisons', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Prices with Tax"
          htmlFor="showPricesWithTax"
          description="Include tax in displayed prices"
        >
          <FormToggle
            id="showPricesWithTax"
            checked={settings.showPricesWithTax}
            onChange={(e) => handleChange('showPricesWithTax', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Guest Checkout"
          htmlFor="allowGuestCheckout"
          description="Allow checkout without account"
        >
          <FormToggle
            id="allowGuestCheckout"
            checked={settings.allowGuestCheckout}
            onChange={(e) => handleChange('allowGuestCheckout', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Require Account for Reviews"
          htmlFor="requireAccountForReviews"
          description="Require account to leave reviews"
        >
          <FormToggle
            id="requireAccountForReviews"
            checked={settings.requireAccountForReviews}
            onChange={(e) => handleChange('requireAccountForReviews', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Auto-Update Exchange Rates"
          htmlFor="autoUpdateExchangeRates"
          description="Automatically update currency rates"
        >
          <FormToggle
            id="autoUpdateExchangeRates"
            checked={settings.autoUpdateExchangeRates}
            onChange={(e) => handleChange('autoUpdateExchangeRates', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Out of Stock Products"
          htmlFor="showOutOfStockProducts"
          description="Display out of stock products"
        >
          <FormToggle
            id="showOutOfStockProducts"
            checked={settings.showOutOfStockProducts}
            onChange={(e) => handleChange('showOutOfStockProducts', e.target.checked)}
          />
        </FormRow>
      </FormSection>
    </div>
  );
} 