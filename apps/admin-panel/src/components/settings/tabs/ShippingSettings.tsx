import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface ShippingSettingsData {
  // General Shipping
  enableShipping: boolean;
  shippingCalculationMethod: string;
  defaultShippingZone: string;
  requireShippingAddress: boolean;
  hideShippingIfUnavailable: boolean;
  displayEstimatedDelivery: boolean;
  
  // Shipping Zones
  enableShippingZones: boolean;
  allowMultipleZones: boolean;
  zonePriorityOrder: string;
  defaultZoneHandling: string;
  restrictByPostcode: boolean;
  allowedPostcodes: string[];
  
  // Shipping Methods
  enableFlatRate: boolean;
  enableFreeShipping: boolean;
  enableLocalPickup: boolean;
  enableTableRates: boolean;
  enableLiveRates: boolean;
  defaultShippingMethod: string;
  
  // Shipping Rates
  freeShippingThreshold: string;
  handlingFee: string;
  insuranceFee: string;
  packagingFee: string;
  minShippingCharge: string;
  maxShippingCharge: string;
  
  // Package Settings
  weightUnit: string;
  dimensionUnit: string;
  defaultLength: string;
  defaultWidth: string;
  defaultHeight: string;
  defaultWeight: string;
  boxSizing: string;
  
  // Delivery Options
  enableExpressDelivery: boolean;
  expressDeliveryFee: string;
  enableLocalDelivery: boolean;
  localDeliveryRadius: string;
  localDeliveryFee: string;
  enablePickupPoints: boolean;
  maxPickupPoints: string;
  
  // International Shipping
  enableInternationalShipping: boolean;
  internationalShippingMethods: string[];
  requireCustomsInfo: boolean;
  defaultHsCode: string;
  defaultOriginCountry: string;
  restrictedCountries: string[];
  
  // Shipping Labels
  enableShippingLabels: boolean;
  defaultLabelFormat: string;
  autoGenerateLabels: boolean;
  labelSender: string;
  returnAddress: string;
  customLabelNotes: string;
}

const calculationMethods = [
  { value: 'per_order', label: 'Per Order' },
  { value: 'per_item', label: 'Per Item' },
  { value: 'weight_based', label: 'Weight Based' },
  { value: 'price_based', label: 'Price Based' },
  { value: 'table_rate', label: 'Table Rate' },
];

const shippingMethods = [
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'local_pickup', label: 'Local Pickup' },
  { value: 'table_rates', label: 'Table Rates' },
  { value: 'live_rates', label: 'Live Rates' },
];

const weightUnits = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
];

const dimensionUnits = [
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
];

const boxSizingOptions = [
  { value: 'actual', label: 'Actual Box Dimensions' },
  { value: 'volume', label: 'Volume Based' },
  { value: 'weight', label: 'Weight Based' },
];

const labelFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'zpl', label: 'ZPL' },
  { value: 'thermal', label: 'Thermal' },
];

const zonePriorityOptions = [
  { value: 'specific_to_general', label: 'Specific to General' },
  { value: 'general_to_specific', label: 'General to Specific' },
];

const zoneHandlingOptions = [
  { value: 'exclude', label: 'Exclude from shipping' },
  { value: 'default_zone', label: 'Use default zone rates' },
  { value: 'fallback_rate', label: 'Use fallback rate' },
];

export function ShippingSettings() {
  const [settings, setSettings] = useState<ShippingSettingsData>({
    // General Shipping
    enableShipping: true,
    shippingCalculationMethod: 'per_order',
    defaultShippingZone: 'domestic',
    requireShippingAddress: true,
    hideShippingIfUnavailable: true,
    displayEstimatedDelivery: true,
    
    // Shipping Zones
    enableShippingZones: true,
    allowMultipleZones: true,
    zonePriorityOrder: 'specific_to_general',
    defaultZoneHandling: 'exclude',
    restrictByPostcode: false,
    allowedPostcodes: [],
    
    // Shipping Methods
    enableFlatRate: true,
    enableFreeShipping: true,
    enableLocalPickup: true,
    enableTableRates: false,
    enableLiveRates: false,
    defaultShippingMethod: 'flat_rate',
    
    // Shipping Rates
    freeShippingThreshold: '100',
    handlingFee: '5',
    insuranceFee: '0',
    packagingFee: '0',
    minShippingCharge: '5',
    maxShippingCharge: '100',
    
    // Package Settings
    weightUnit: 'kg',
    dimensionUnit: 'cm',
    defaultLength: '30',
    defaultWidth: '20',
    defaultHeight: '15',
    defaultWeight: '1',
    boxSizing: 'actual',
    
    // Delivery Options
    enableExpressDelivery: true,
    expressDeliveryFee: '15',
    enableLocalDelivery: true,
    localDeliveryRadius: '20',
    localDeliveryFee: '5',
    enablePickupPoints: true,
    maxPickupPoints: '5',
    
    // International Shipping
    enableInternationalShipping: true,
    internationalShippingMethods: ['flat_rate', 'table_rates'],
    requireCustomsInfo: true,
    defaultHsCode: '',
    defaultOriginCountry: 'US',
    restrictedCountries: [],
    
    // Shipping Labels
    enableShippingLabels: true,
    defaultLabelFormat: 'pdf',
    autoGenerateLabels: true,
    labelSender: '',
    returnAddress: '',
    customLabelNotes: '',
  });

  const handleChange = (field: keyof ShippingSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* General Shipping */}
      <FormSection 
        title="General Shipping" 
        description="Configure basic shipping settings"
      >
        <FormRow
          label="Enable Shipping"
          htmlFor="enableShipping"
          description="Enable shipping functionality"
        >
          <FormToggle
            id="enableShipping"
            checked={settings.enableShipping}
            onChange={(e) => handleChange('enableShipping', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Calculation Method"
          htmlFor="shippingCalculationMethod"
          description="How shipping costs are calculated"
        >
          <FormSelect
            id="shippingCalculationMethod"
            value={settings.shippingCalculationMethod}
            onChange={(e) => handleChange('shippingCalculationMethod', e.target.value)}
            options={calculationMethods}
          />
        </FormRow>

        <FormRow
          label="Default Shipping Zone"
          htmlFor="defaultShippingZone"
          description="Default zone for shipping calculations"
        >
          <FormInput
            id="defaultShippingZone"
            value={settings.defaultShippingZone}
            onChange={(e) => handleChange('defaultShippingZone', e.target.value)}
          />
        </FormRow>

        <FormRow
          label="Require Shipping Address"
          htmlFor="requireShippingAddress"
          description="Require complete shipping address"
        >
          <FormToggle
            id="requireShippingAddress"
            checked={settings.requireShippingAddress}
            onChange={(e) => handleChange('requireShippingAddress', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Hide Unavailable Shipping"
          htmlFor="hideShippingIfUnavailable"
          description="Hide shipping methods when unavailable"
        >
          <FormToggle
            id="hideShippingIfUnavailable"
            checked={settings.hideShippingIfUnavailable}
            onChange={(e) => handleChange('hideShippingIfUnavailable', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Display Estimated Delivery"
          htmlFor="displayEstimatedDelivery"
          description="Show estimated delivery dates"
        >
          <FormToggle
            id="displayEstimatedDelivery"
            checked={settings.displayEstimatedDelivery}
            onChange={(e) => handleChange('displayEstimatedDelivery', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Shipping Zones */}
      <FormSection 
        title="Shipping Zones" 
        description="Configure shipping zones and restrictions"
      >
        <FormRow
          label="Enable Shipping Zones"
          htmlFor="enableShippingZones"
          description="Use shipping zones for rate calculation"
        >
          <FormToggle
            id="enableShippingZones"
            checked={settings.enableShippingZones}
            onChange={(e) => handleChange('enableShippingZones', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Multiple Zones"
          htmlFor="allowMultipleZones"
          description="Allow address to match multiple zones"
        >
          <FormToggle
            id="allowMultipleZones"
            checked={settings.allowMultipleZones}
            onChange={(e) => handleChange('allowMultipleZones', e.target.checked)}
            disabled={!settings.enableShippingZones}
          />
        </FormRow>

        <FormRow
          label="Zone Priority Order"
          htmlFor="zonePriorityOrder"
          description="Order of zone application"
        >
          <FormSelect
            id="zonePriorityOrder"
            value={settings.zonePriorityOrder}
            onChange={(e) => handleChange('zonePriorityOrder', e.target.value)}
            options={zonePriorityOptions}
            disabled={!settings.enableShippingZones}
          />
        </FormRow>

        <FormRow
          label="Default Zone Handling"
          htmlFor="defaultZoneHandling"
          description="How to handle addresses not in any zone"
        >
          <FormSelect
            id="defaultZoneHandling"
            value={settings.defaultZoneHandling}
            onChange={(e) => handleChange('defaultZoneHandling', e.target.value)}
            options={zoneHandlingOptions}
            disabled={!settings.enableShippingZones}
          />
        </FormRow>

        <FormRow
          label="Restrict by Postcode"
          htmlFor="restrictByPostcode"
          description="Limit shipping to specific postcodes"
        >
          <FormToggle
            id="restrictByPostcode"
            checked={settings.restrictByPostcode}
            onChange={(e) => handleChange('restrictByPostcode', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allowed Postcodes"
          htmlFor="allowedPostcodes"
          description="Comma-separated list of allowed postcodes"
        >
          <FormInput
            id="allowedPostcodes"
            value={settings.allowedPostcodes.join(', ')}
            onChange={(e) => handleChange('allowedPostcodes', e.target.value.split(',').map(p => p.trim()))}
            placeholder="90210, 10001, SW1A 1AA"
            disabled={!settings.restrictByPostcode}
          />
        </FormRow>
      </FormSection>

      {/* Shipping Methods */}
      <FormSection 
        title="Shipping Methods" 
        description="Configure available shipping methods"
      >
        <FormRow
          label="Enable Flat Rate"
          htmlFor="enableFlatRate"
          description="Enable flat rate shipping"
        >
          <FormToggle
            id="enableFlatRate"
            checked={settings.enableFlatRate}
            onChange={(e) => handleChange('enableFlatRate', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Free Shipping"
          htmlFor="enableFreeShipping"
          description="Enable free shipping option"
        >
          <FormToggle
            id="enableFreeShipping"
            checked={settings.enableFreeShipping}
            onChange={(e) => handleChange('enableFreeShipping', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Local Pickup"
          htmlFor="enableLocalPickup"
          description="Enable local pickup option"
        >
          <FormToggle
            id="enableLocalPickup"
            checked={settings.enableLocalPickup}
            onChange={(e) => handleChange('enableLocalPickup', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Table Rates"
          htmlFor="enableTableRates"
          description="Enable table rate shipping"
        >
          <FormToggle
            id="enableTableRates"
            checked={settings.enableTableRates}
            onChange={(e) => handleChange('enableTableRates', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Live Rates"
          htmlFor="enableLiveRates"
          description="Enable real-time carrier rates"
        >
          <FormToggle
            id="enableLiveRates"
            checked={settings.enableLiveRates}
            onChange={(e) => handleChange('enableLiveRates', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Default Shipping Method"
          htmlFor="defaultShippingMethod"
          description="Default method when multiple available"
        >
          <FormSelect
            id="defaultShippingMethod"
            value={settings.defaultShippingMethod}
            onChange={(e) => handleChange('defaultShippingMethod', e.target.value)}
            options={shippingMethods}
          />
        </FormRow>
      </FormSection>

      {/* Shipping Rates */}
      <FormSection 
        title="Shipping Rates" 
        description="Configure shipping rates and fees"
      >
        <FormRow
          label="Free Shipping Threshold"
          htmlFor="freeShippingThreshold"
          description="Order amount for free shipping"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="freeShippingThreshold"
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => handleChange('freeShippingThreshold', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>

        <FormRow
          label="Handling Fee"
          htmlFor="handlingFee"
          description="Additional handling fee"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="handlingFee"
              type="number"
              value={settings.handlingFee}
              onChange={(e) => handleChange('handlingFee', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>

        <FormRow
          label="Insurance Fee"
          htmlFor="insuranceFee"
          description="Shipping insurance fee"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="insuranceFee"
              type="number"
              value={settings.insuranceFee}
              onChange={(e) => handleChange('insuranceFee', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>

        <FormRow
          label="Packaging Fee"
          htmlFor="packagingFee"
          description="Additional packaging fee"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="packagingFee"
              type="number"
              value={settings.packagingFee}
              onChange={(e) => handleChange('packagingFee', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>

        <FormRow
          label="Minimum Shipping Charge"
          htmlFor="minShippingCharge"
          description="Minimum shipping cost"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="minShippingCharge"
              type="number"
              value={settings.minShippingCharge}
              onChange={(e) => handleChange('minShippingCharge', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>

        <FormRow
          label="Maximum Shipping Charge"
          htmlFor="maxShippingCharge"
          description="Maximum shipping cost"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <FormInput
              id="maxShippingCharge"
              type="number"
              value={settings.maxShippingCharge}
              onChange={(e) => handleChange('maxShippingCharge', e.target.value)}
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </FormRow>
      </FormSection>

      {/* Package Settings */}
      <FormSection 
        title="Package Settings" 
        description="Configure package dimensions and weights"
      >
        <FormRow
          label="Weight Unit"
          htmlFor="weightUnit"
          description="Unit for weight measurements"
        >
          <FormSelect
            id="weightUnit"
            value={settings.weightUnit}
            onChange={(e) => handleChange('weightUnit', e.target.value)}
            options={weightUnits}
          />
        </FormRow>

        <FormRow
          label="Dimension Unit"
          htmlFor="dimensionUnit"
          description="Unit for dimension measurements"
        >
          <FormSelect
            id="dimensionUnit"
            value={settings.dimensionUnit}
            onChange={(e) => handleChange('dimensionUnit', e.target.value)}
            options={dimensionUnits}
          />
        </FormRow>

        <FormRow
          label="Default Length"
          htmlFor="defaultLength"
          description="Default package length"
        >
          <FormInput
            id="defaultLength"
            type="number"
            value={settings.defaultLength}
            onChange={(e) => handleChange('defaultLength', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Default Width"
          htmlFor="defaultWidth"
          description="Default package width"
        >
          <FormInput
            id="defaultWidth"
            type="number"
            value={settings.defaultWidth}
            onChange={(e) => handleChange('defaultWidth', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Default Height"
          htmlFor="defaultHeight"
          description="Default package height"
        >
          <FormInput
            id="defaultHeight"
            type="number"
            value={settings.defaultHeight}
            onChange={(e) => handleChange('defaultHeight', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Default Weight"
          htmlFor="defaultWeight"
          description="Default package weight"
        >
          <FormInput
            id="defaultWeight"
            type="number"
            value={settings.defaultWeight}
            onChange={(e) => handleChange('defaultWeight', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Box Sizing Method"
          htmlFor="boxSizing"
          description="How to calculate box dimensions"
        >
          <FormSelect
            id="boxSizing"
            value={settings.boxSizing}
            onChange={(e) => handleChange('boxSizing', e.target.value)}
            options={boxSizingOptions}
          />
        </FormRow>
      </FormSection>

      {/* Delivery Options */}
      <FormSection 
        title="Delivery Options" 
        description="Configure delivery methods and options"
      >
        <FormRow
          label="Enable Express Delivery"
          htmlFor="enableExpressDelivery"
          description="Offer express delivery option"
        >
          <FormToggle
            id="enableExpressDelivery"
            checked={settings.enableExpressDelivery}
            onChange={(e) => handleChange('enableExpressDelivery', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Express Delivery Fee"
          htmlFor="expressDeliveryFee"
          description="Additional fee for express delivery"
        >
          <FormInput
            id="expressDeliveryFee"
            type="number"
            value={settings.expressDeliveryFee}
            onChange={(e) => handleChange('expressDeliveryFee', e.target.value)}
            min="0"
            disabled={!settings.enableExpressDelivery}
          />
        </FormRow>

        <FormRow
          label="Enable Local Delivery"
          htmlFor="enableLocalDelivery"
          description="Offer local delivery option"
        >
          <FormToggle
            id="enableLocalDelivery"
            checked={settings.enableLocalDelivery}
            onChange={(e) => handleChange('enableLocalDelivery', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Local Delivery Radius"
          htmlFor="localDeliveryRadius"
          description="Maximum radius for local delivery (km)"
        >
          <FormInput
            id="localDeliveryRadius"
            type="number"
            value={settings.localDeliveryRadius}
            onChange={(e) => handleChange('localDeliveryRadius', e.target.value)}
            min="0"
            disabled={!settings.enableLocalDelivery}
          />
        </FormRow>

        <FormRow
          label="Local Delivery Fee"
          htmlFor="localDeliveryFee"
          description="Fee for local delivery"
        >
          <FormInput
            id="localDeliveryFee"
            type="number"
            value={settings.localDeliveryFee}
            onChange={(e) => handleChange('localDeliveryFee', e.target.value)}
            min="0"
            disabled={!settings.enableLocalDelivery}
          />
        </FormRow>

        <FormRow
          label="Enable Pickup Points"
          htmlFor="enablePickupPoints"
          description="Allow pickup from multiple locations"
        >
          <FormToggle
            id="enablePickupPoints"
            checked={settings.enablePickupPoints}
            onChange={(e) => handleChange('enablePickupPoints', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Maximum Pickup Points"
          htmlFor="maxPickupPoints"
          description="Maximum number of pickup locations"
        >
          <FormInput
            id="maxPickupPoints"
            type="number"
            value={settings.maxPickupPoints}
            onChange={(e) => handleChange('maxPickupPoints', e.target.value)}
            min="1"
            disabled={!settings.enablePickupPoints}
          />
        </FormRow>
      </FormSection>

      {/* International Shipping */}
      <FormSection 
        title="International Shipping" 
        description="Configure international shipping options"
      >
        <FormRow
          label="Enable International Shipping"
          htmlFor="enableInternationalShipping"
          description="Allow shipping to international addresses"
        >
          <FormToggle
            id="enableInternationalShipping"
            checked={settings.enableInternationalShipping}
            onChange={(e) => handleChange('enableInternationalShipping', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="International Methods"
          htmlFor="internationalShippingMethods"
          description="Available international shipping methods"
        >
          <FormInput
            id="internationalShippingMethods"
            value={settings.internationalShippingMethods.join(', ')}
            onChange={(e) => handleChange('internationalShippingMethods', e.target.value.split(',').map(m => m.trim()))}
            placeholder="flat_rate, table_rates"
            disabled={!settings.enableInternationalShipping}
          />
        </FormRow>

        <FormRow
          label="Require Customs Info"
          htmlFor="requireCustomsInfo"
          description="Require customs information"
        >
          <FormToggle
            id="requireCustomsInfo"
            checked={settings.requireCustomsInfo}
            onChange={(e) => handleChange('requireCustomsInfo', e.target.checked)}
            disabled={!settings.enableInternationalShipping}
          />
        </FormRow>

        <FormRow
          label="Default HS Code"
          htmlFor="defaultHsCode"
          description={
            <div>
              <p>Default harmonized system code</p>
              <p className="text-xs text-gray-500 mt-1">
                The HS code is a standardized numerical method of classifying traded products. 
                Format: 6-10 digits (e.g., 6103.42.1020)
              </p>
            </div>
          }
        >
          <FormInput
            id="defaultHsCode"
            value={settings.defaultHsCode}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              handleChange('defaultHsCode', value);
            }}
            placeholder="e.g., 6103.42.1020"
            disabled={!settings.enableInternationalShipping || !settings.requireCustomsInfo}
          />
        </FormRow>

        <FormRow
          label="Default Origin Country"
          htmlFor="defaultOriginCountry"
          description={
            <div>
              <p>Country code for shipping origin</p>
              <p className="text-xs text-gray-500 mt-1">
                Use ISO 3166-1 alpha-2 country code (e.g., US, GB, DE)
              </p>
            </div>
          }
        >
          <FormInput
            id="defaultOriginCountry"
            value={settings.defaultOriginCountry}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
              handleChange('defaultOriginCountry', value);
            }}
            maxLength={2}
            placeholder="US"
            disabled={!settings.enableInternationalShipping}
          />
        </FormRow>

        <FormRow
          label="Restricted Countries"
          htmlFor="restrictedCountries"
          description="Countries excluded from shipping"
        >
          <FormInput
            id="restrictedCountries"
            value={settings.restrictedCountries.join(', ')}
            onChange={(e) => handleChange('restrictedCountries', e.target.value.split(',').map(c => c.trim()))}
            placeholder="NK, CU"
            disabled={!settings.enableInternationalShipping}
          />
        </FormRow>
      </FormSection>

      {/* Shipping Labels */}
      <FormSection 
        title="Shipping Labels" 
        description="Configure shipping label generation"
      >
        <FormRow
          label="Enable Shipping Labels"
          htmlFor="enableShippingLabels"
          description="Enable shipping label generation"
        >
          <FormToggle
            id="enableShippingLabels"
            checked={settings.enableShippingLabels}
            onChange={(e) => handleChange('enableShippingLabels', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Default Label Format"
          htmlFor="defaultLabelFormat"
          description="Default format for shipping labels"
        >
          <FormSelect
            id="defaultLabelFormat"
            value={settings.defaultLabelFormat}
            onChange={(e) => handleChange('defaultLabelFormat', e.target.value)}
            options={labelFormats}
            disabled={!settings.enableShippingLabels}
          />
        </FormRow>

        <FormRow
          label="Auto-Generate Labels"
          htmlFor="autoGenerateLabels"
          description="Automatically generate labels for orders"
        >
          <FormToggle
            id="autoGenerateLabels"
            checked={settings.autoGenerateLabels}
            onChange={(e) => handleChange('autoGenerateLabels', e.target.checked)}
            disabled={!settings.enableShippingLabels}
          />
        </FormRow>

        <FormRow
          label="Label Sender"
          htmlFor="labelSender"
          description="Default sender name on labels"
        >
          <FormInput
            id="labelSender"
            value={settings.labelSender}
            onChange={(e) => handleChange('labelSender', e.target.value)}
            disabled={!settings.enableShippingLabels}
          />
        </FormRow>

        <FormRow
          label="Return Address"
          htmlFor="returnAddress"
          description="Default return address for labels"
        >
          <FormTextarea
            id="returnAddress"
            value={settings.returnAddress}
            onChange={(e) => handleChange('returnAddress', e.target.value)}
            disabled={!settings.enableShippingLabels}
          />
        </FormRow>

        <FormRow
          label="Custom Label Notes"
          htmlFor="customLabelNotes"
          description="Additional notes for shipping labels"
        >
          <FormTextarea
            id="customLabelNotes"
            value={settings.customLabelNotes}
            onChange={(e) => handleChange('customLabelNotes', e.target.value)}
            disabled={!settings.enableShippingLabels}
          />
        </FormRow>
      </FormSection>
    </div>
  );
} 