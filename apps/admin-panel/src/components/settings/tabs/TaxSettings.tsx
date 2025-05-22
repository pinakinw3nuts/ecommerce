import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface TaxSettingsData {
  // General Tax Settings
  enableTaxes: boolean;
  pricesIncludeTax: boolean;
  taxCalculationMethod: string;
  defaultTaxClass: string;
  displayPricesInShop: string;
  displayPricesInCart: string;
  displayTaxTotals: string;

  // Tax Rates
  enableMultipleRates: boolean;
  defaultTaxRate: string;
  shippingTaxClass: string;
  roundingPrecision: string;
  roundAtSubtotal: boolean;

  // Location Settings
  taxBasedOn: string;
  defaultCountry: string;
  defaultState: string;
  defaultPostcode: string;
  shippingTaxation: string;
  euVatSupport: boolean;

  // Digital Products
  digitalTaxClass: string;
  digitalTaxRate: string;
  digitalGoodsVatMoss: boolean;

  // Tax Display
  displaySubtotalPrices: string;
  displayZeroTax: boolean;
  displayTaxBreakdown: boolean;
  suffixDisplayPrices: boolean;

  // Additional Settings
  enableTaxExemption: boolean;
  taxExemptionValidation: string;
  keepTaxRecords: boolean;
  recordRetentionPeriod: string;
}

const taxCalculationMethods = [
  { value: 'row', label: 'Line item based' },
  { value: 'total', label: 'Order total based' },
];

const taxClasses = [
  { value: 'standard', label: 'Standard Rate' },
  { value: 'reduced', label: 'Reduced Rate' },
  { value: 'zero', label: 'Zero Rate' },
];

const displayOptions = [
  { value: 'incl', label: 'Including tax' },
  { value: 'excl', label: 'Excluding tax' },
  { value: 'both', label: 'Both including and excluding tax' },
];

const taxationBasis = [
  { value: 'shipping', label: 'Customer shipping address' },
  { value: 'billing', label: 'Customer billing address' },
  { value: 'base', label: 'Shop base address' },
];

const shippingTaxOptions = [
  { value: 'standard', label: 'Standard shipping tax rate' },
  { value: 'destination', label: 'Based on destination' },
  { value: 'none', label: 'No shipping tax' },
];

const exemptionValidation = [
  { value: 'automatic', label: 'Automatic validation' },
  { value: 'manual', label: 'Manual validation required' },
  { value: 'none', label: 'No validation required' },
];

export function TaxSettings() {
  const [settings, setSettings] = useState<TaxSettingsData>({
    // General Tax Settings
    enableTaxes: true,
    pricesIncludeTax: false,
    taxCalculationMethod: 'row',
    defaultTaxClass: 'standard',
    displayPricesInShop: 'incl',
    displayPricesInCart: 'incl',
    displayTaxTotals: 'both',

    // Tax Rates
    enableMultipleRates: true,
    defaultTaxRate: '20',
    shippingTaxClass: 'standard',
    roundingPrecision: '4',
    roundAtSubtotal: true,

    // Location Settings
    taxBasedOn: 'shipping',
    defaultCountry: 'US',
    defaultState: '',
    defaultPostcode: '',
    shippingTaxation: 'standard',
    euVatSupport: false,

    // Digital Products
    digitalTaxClass: 'standard',
    digitalTaxRate: '20',
    digitalGoodsVatMoss: false,

    // Tax Display
    displaySubtotalPrices: 'incl',
    displayZeroTax: false,
    displayTaxBreakdown: true,
    suffixDisplayPrices: true,

    // Additional Settings
    enableTaxExemption: false,
    taxExemptionValidation: 'automatic',
    keepTaxRecords: true,
    recordRetentionPeriod: '7',
  });

  const handleChange = (field: keyof TaxSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* General Tax Settings */}
      <FormSection 
        title="General Tax Settings" 
        description="Configure basic tax settings for your store"
      >
        <FormRow
          label="Enable Taxes"
          htmlFor="enableTaxes"
          description="Enable tax calculations and display"
        >
          <FormToggle
            id="enableTaxes"
            checked={settings.enableTaxes}
            onChange={(e) => handleChange('enableTaxes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Prices Include Tax"
          htmlFor="pricesIncludeTax"
          description="Enter prices inclusive of tax"
        >
          <FormToggle
            id="pricesIncludeTax"
            checked={settings.pricesIncludeTax}
            onChange={(e) => handleChange('pricesIncludeTax', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Tax Calculation Method"
          htmlFor="taxCalculationMethod"
          description="Choose how taxes are calculated"
        >
          <FormSelect
            id="taxCalculationMethod"
            value={settings.taxCalculationMethod}
            onChange={(e) => handleChange('taxCalculationMethod', e.target.value)}
            options={taxCalculationMethods}
          />
        </FormRow>

        <FormRow
          label="Default Tax Class"
          htmlFor="defaultTaxClass"
          description="Default tax class for new products"
        >
          <FormSelect
            id="defaultTaxClass"
            value={settings.defaultTaxClass}
            onChange={(e) => handleChange('defaultTaxClass', e.target.value)}
            options={taxClasses}
          />
        </FormRow>
      </FormSection>

      {/* Tax Rates */}
      <FormSection 
        title="Tax Rates" 
        description="Configure tax rates and calculations"
      >
        <FormRow
          label="Multiple Tax Rates"
          htmlFor="enableMultipleRates"
          description="Enable multiple tax rates based on location"
        >
          <FormToggle
            id="enableMultipleRates"
            checked={settings.enableMultipleRates}
            onChange={(e) => handleChange('enableMultipleRates', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Default Tax Rate"
          htmlFor="defaultTaxRate"
          description="Default tax rate percentage"
        >
          <FormInput
            id="defaultTaxRate"
            type="number"
            value={settings.defaultTaxRate}
            onChange={(e) => handleChange('defaultTaxRate', e.target.value)}
            min="0"
            max="100"
            step="0.01"
          />
        </FormRow>

        <FormRow
          label="Shipping Tax Class"
          htmlFor="shippingTaxClass"
          description="Tax class for shipping methods"
        >
          <FormSelect
            id="shippingTaxClass"
            value={settings.shippingTaxClass}
            onChange={(e) => handleChange('shippingTaxClass', e.target.value)}
            options={taxClasses}
          />
        </FormRow>

        <FormRow
          label="Rounding Precision"
          htmlFor="roundingPrecision"
          description="Decimal places for tax calculations"
        >
          <FormInput
            id="roundingPrecision"
            type="number"
            value={settings.roundingPrecision}
            onChange={(e) => handleChange('roundingPrecision', e.target.value)}
            min="0"
            max="6"
          />
        </FormRow>
      </FormSection>

      {/* Location Settings */}
      <FormSection 
        title="Location Settings" 
        description="Configure tax location settings"
      >
        <FormRow
          label="Calculate Tax Based On"
          htmlFor="taxBasedOn"
          description="Choose the address used for tax calculations"
        >
          <FormSelect
            id="taxBasedOn"
            value={settings.taxBasedOn}
            onChange={(e) => handleChange('taxBasedOn', e.target.value)}
            options={taxationBasis}
          />
        </FormRow>

        <FormRow
          label="Default Country"
          htmlFor="defaultCountry"
          description="Default country for tax calculations"
        >
          <FormInput
            id="defaultCountry"
            value={settings.defaultCountry}
            onChange={(e) => handleChange('defaultCountry', e.target.value)}
            placeholder="Country code (e.g., US)"
          />
        </FormRow>

        <FormRow
          label="Shipping Tax"
          htmlFor="shippingTaxation"
          description="How shipping should be taxed"
        >
          <FormSelect
            id="shippingTaxation"
            value={settings.shippingTaxation}
            onChange={(e) => handleChange('shippingTaxation', e.target.value)}
            options={shippingTaxOptions}
          />
        </FormRow>

        <FormRow
          label="EU VAT Support"
          htmlFor="euVatSupport"
          description="Enable EU VAT number validation and rules"
        >
          <FormToggle
            id="euVatSupport"
            checked={settings.euVatSupport}
            onChange={(e) => handleChange('euVatSupport', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Digital Products */}
      <FormSection 
        title="Digital Products" 
        description="Configure tax settings for digital products"
      >
        <FormRow
          label="Digital Tax Class"
          htmlFor="digitalTaxClass"
          description="Tax class for digital products"
        >
          <FormSelect
            id="digitalTaxClass"
            value={settings.digitalTaxClass}
            onChange={(e) => handleChange('digitalTaxClass', e.target.value)}
            options={taxClasses}
          />
        </FormRow>

        <FormRow
          label="Digital Tax Rate"
          htmlFor="digitalTaxRate"
          description="Default tax rate for digital products"
        >
          <FormInput
            id="digitalTaxRate"
            type="number"
            value={settings.digitalTaxRate}
            onChange={(e) => handleChange('digitalTaxRate', e.target.value)}
            min="0"
            max="100"
            step="0.01"
          />
        </FormRow>

        <FormRow
          label="EU VAT MOSS"
          htmlFor="digitalGoodsVatMoss"
          description="Enable VAT MOSS for digital goods in EU"
        >
          <FormToggle
            id="digitalGoodsVatMoss"
            checked={settings.digitalGoodsVatMoss}
            onChange={(e) => handleChange('digitalGoodsVatMoss', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Tax Display */}
      <FormSection 
        title="Tax Display" 
        description="Configure how taxes are displayed"
      >
        <FormRow
          label="Display Prices in Shop"
          htmlFor="displayPricesInShop"
          description="How prices should be displayed in the shop"
        >
          <FormSelect
            id="displayPricesInShop"
            value={settings.displayPricesInShop}
            onChange={(e) => handleChange('displayPricesInShop', e.target.value)}
            options={displayOptions}
          />
        </FormRow>

        <FormRow
          label="Display Prices in Cart"
          htmlFor="displayPricesInCart"
          description="How prices should be displayed in the cart"
        >
          <FormSelect
            id="displayPricesInCart"
            value={settings.displayPricesInCart}
            onChange={(e) => handleChange('displayPricesInCart', e.target.value)}
            options={displayOptions}
          />
        </FormRow>

        <FormRow
          label="Display Zero Tax"
          htmlFor="displayZeroTax"
          description="Show zero tax amounts in cart and checkout"
        >
          <FormToggle
            id="displayZeroTax"
            checked={settings.displayZeroTax}
            onChange={(e) => handleChange('displayZeroTax', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Display Tax Breakdown"
          htmlFor="displayTaxBreakdown"
          description="Show detailed tax breakdown in cart"
        >
          <FormToggle
            id="displayTaxBreakdown"
            checked={settings.displayTaxBreakdown}
            onChange={(e) => handleChange('displayTaxBreakdown', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Additional Settings */}
      <FormSection 
        title="Additional Settings" 
        description="Configure additional tax settings"
      >
        <FormRow
          label="Tax Exemption"
          htmlFor="enableTaxExemption"
          description="Allow customers to claim tax exemption"
        >
          <FormToggle
            id="enableTaxExemption"
            checked={settings.enableTaxExemption}
            onChange={(e) => handleChange('enableTaxExemption', e.target.checked)}
          />
        </FormRow>

        {settings.enableTaxExemption && (
          <FormRow
            label="Exemption Validation"
            htmlFor="taxExemptionValidation"
            description="How tax exemption claims should be validated"
          >
            <FormSelect
              id="taxExemptionValidation"
              value={settings.taxExemptionValidation}
              onChange={(e) => handleChange('taxExemptionValidation', e.target.value)}
              options={exemptionValidation}
            />
          </FormRow>
        )}

        <FormRow
          label="Keep Tax Records"
          htmlFor="keepTaxRecords"
          description="Maintain detailed tax calculation records"
        >
          <FormToggle
            id="keepTaxRecords"
            checked={settings.keepTaxRecords}
            onChange={(e) => handleChange('keepTaxRecords', e.target.checked)}
          />
        </FormRow>

        {settings.keepTaxRecords && (
          <FormRow
            label="Record Retention Period"
            htmlFor="recordRetentionPeriod"
            description="Number of years to keep tax records"
          >
            <FormInput
              id="recordRetentionPeriod"
              type="number"
              value={settings.recordRetentionPeriod}
              onChange={(e) => handleChange('recordRetentionPeriod', e.target.value)}
              min="1"
              max="10"
            />
          </FormRow>
        )}
      </FormSection>
    </div>
  );
} 