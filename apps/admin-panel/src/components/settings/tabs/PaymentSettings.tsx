import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface PaymentSettingsData {
  // General Payment Settings
  enablePayments: boolean;
  testMode: boolean;
  defaultCurrency: string;
  currencyPosition: string;
  thousandSeparator: string;
  decimalSeparator: string;
  numberOfDecimals: string;

  // Payment Methods
  enableCreditCards: boolean;
  enablePayPal: boolean;
  enableBankTransfer: boolean;
  enableCashOnDelivery: boolean;
  enableCrypto: boolean;

  // Credit Card Settings
  creditCardGateway: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  saveCards: boolean;
  requireCVV: boolean;
  
  // PayPal Settings
  paypalClientId: string;
  paypalSecretKey: string;
  paypalEnvironment: string;
  
  // Security Settings
  enableSSL: boolean;
  enableFraudDetection: boolean;
  maxTransactionAmount: string;
  restrictedCountries: string[];
  
  // Checkout Settings
  requirePhone: boolean;
  requireCompany: boolean;
  allowGuestCheckout: boolean;
  termsAndConditions: boolean;
  checkoutNotes: boolean;
}

const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
];

const currencyPositions = [
  { value: 'left', label: 'Left ($99.99)' },
  { value: 'right', label: 'Right (99.99$)' },
  { value: 'left_space', label: 'Left with space ($ 99.99)' },
  { value: 'right_space', label: 'Right with space (99.99 $)' },
];

const creditCardGateways = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'square', label: 'Square' },
  { value: 'authorize', label: 'Authorize.net' },
  { value: 'custom', label: 'Custom Gateway' },
];

const paypalEnvironments = [
  { value: 'sandbox', label: 'Sandbox (Testing)' },
  { value: 'production', label: 'Production (Live)' },
];

export function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsData>({
    // General Payment Settings
    enablePayments: true,
    testMode: false,
    defaultCurrency: 'USD',
    currencyPosition: 'left',
    thousandSeparator: ',',
    decimalSeparator: '.',
    numberOfDecimals: '2',

    // Payment Methods
    enableCreditCards: true,
    enablePayPal: true,
    enableBankTransfer: false,
    enableCashOnDelivery: false,
    enableCrypto: false,

    // Credit Card Settings
    creditCardGateway: 'stripe',
    stripePublicKey: '',
    stripeSecretKey: '',
    saveCards: true,
    requireCVV: true,
    
    // PayPal Settings
    paypalClientId: '',
    paypalSecretKey: '',
    paypalEnvironment: 'sandbox',
    
    // Security Settings
    enableSSL: true,
    enableFraudDetection: true,
    maxTransactionAmount: '10000',
    restrictedCountries: [],
    
    // Checkout Settings
    requirePhone: true,
    requireCompany: false,
    allowGuestCheckout: true,
    termsAndConditions: true,
    checkoutNotes: true,
  });

  const handleChange = (field: keyof PaymentSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* General Payment Settings */}
      <FormSection 
        title="General Payment Settings" 
        description="Configure basic payment settings for your store"
      >
        <FormRow
          label="Enable Payments"
          htmlFor="enablePayments"
          description="Enable payment processing in your store"
        >
          <FormToggle
            id="enablePayments"
            checked={settings.enablePayments}
            onChange={(e) => handleChange('enablePayments', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Test Mode"
          htmlFor="testMode"
          description="Enable test mode for payment processing"
        >
          <FormToggle
            id="testMode"
            checked={settings.testMode}
            onChange={(e) => handleChange('testMode', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Default Currency"
          htmlFor="defaultCurrency"
          description="Select your store's default currency"
        >
          <FormSelect
            id="defaultCurrency"
            value={settings.defaultCurrency}
            onChange={(e) => handleChange('defaultCurrency', e.target.value)}
            options={currencyOptions}
          />
        </FormRow>

        <FormRow
          label="Currency Position"
          htmlFor="currencyPosition"
          description="Choose where to display the currency symbol"
        >
          <FormSelect
            id="currencyPosition"
            value={settings.currencyPosition}
            onChange={(e) => handleChange('currencyPosition', e.target.value)}
            options={currencyPositions}
          />
        </FormRow>

        <FormRow
          label="Number Format"
          htmlFor="thousandSeparator"
          description="Configure how numbers are displayed"
        >
          <div className="grid grid-cols-3 gap-2">
            <FormInput
              id="thousandSeparator"
              value={settings.thousandSeparator}
              onChange={(e) => handleChange('thousandSeparator', e.target.value)}
              placeholder="Thousand separator"
              maxLength={1}
            />
            <FormInput
              id="decimalSeparator"
              value={settings.decimalSeparator}
              onChange={(e) => handleChange('decimalSeparator', e.target.value)}
              placeholder="Decimal separator"
              maxLength={1}
            />
            <FormInput
              id="numberOfDecimals"
              type="number"
              value={settings.numberOfDecimals}
              onChange={(e) => handleChange('numberOfDecimals', e.target.value)}
              placeholder="Number of decimals"
              min="0"
              max="4"
            />
          </div>
        </FormRow>
      </FormSection>

      {/* Payment Methods */}
      <FormSection 
        title="Payment Methods" 
        description="Configure available payment methods"
      >
        <FormRow
          label="Credit Cards"
          htmlFor="enableCreditCards"
          description="Accept credit card payments"
        >
          <FormToggle
            id="enableCreditCards"
            checked={settings.enableCreditCards}
            onChange={(e) => handleChange('enableCreditCards', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="PayPal"
          htmlFor="enablePayPal"
          description="Accept PayPal payments"
        >
          <FormToggle
            id="enablePayPal"
            checked={settings.enablePayPal}
            onChange={(e) => handleChange('enablePayPal', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Bank Transfer"
          htmlFor="enableBankTransfer"
          description="Accept direct bank transfer payments"
        >
          <FormToggle
            id="enableBankTransfer"
            checked={settings.enableBankTransfer}
            onChange={(e) => handleChange('enableBankTransfer', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Cash on Delivery"
          htmlFor="enableCashOnDelivery"
          description="Accept cash on delivery payments"
        >
          <FormToggle
            id="enableCashOnDelivery"
            checked={settings.enableCashOnDelivery}
            onChange={(e) => handleChange('enableCashOnDelivery', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Cryptocurrency"
          htmlFor="enableCrypto"
          description="Accept cryptocurrency payments"
        >
          <FormToggle
            id="enableCrypto"
            checked={settings.enableCrypto}
            onChange={(e) => handleChange('enableCrypto', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Credit Card Settings */}
      {settings.enableCreditCards && (
        <FormSection 
          title="Credit Card Settings" 
          description="Configure credit card payment processing"
        >
          <FormRow
            label="Payment Gateway"
            htmlFor="creditCardGateway"
            description="Select your credit card payment processor"
          >
            <FormSelect
              id="creditCardGateway"
              value={settings.creditCardGateway}
              onChange={(e) => handleChange('creditCardGateway', e.target.value)}
              options={creditCardGateways}
            />
          </FormRow>

          {settings.creditCardGateway === 'stripe' && (
            <>
              <FormRow
                label="Stripe Public Key"
                htmlFor="stripePublicKey"
                description="Your Stripe publishable key"
              >
                <FormInput
                  id="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={(e) => handleChange('stripePublicKey', e.target.value)}
                  placeholder="pk_test_..."
                />
              </FormRow>

              <FormRow
                label="Stripe Secret Key"
                htmlFor="stripeSecretKey"
                description="Your Stripe secret key"
              >
                <FormInput
                  id="stripeSecretKey"
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={(e) => handleChange('stripeSecretKey', e.target.value)}
                  placeholder="sk_test_..."
                />
              </FormRow>
            </>
          )}

          <FormRow
            label="Save Cards"
            htmlFor="saveCards"
            description="Allow customers to save their cards for future purchases"
          >
            <FormToggle
              id="saveCards"
              checked={settings.saveCards}
              onChange={(e) => handleChange('saveCards', e.target.checked)}
            />
          </FormRow>

          <FormRow
            label="Require CVV"
            htmlFor="requireCVV"
            description="Require CVV for saved cards"
          >
            <FormToggle
              id="requireCVV"
              checked={settings.requireCVV}
              onChange={(e) => handleChange('requireCVV', e.target.checked)}
            />
          </FormRow>
        </FormSection>
      )}

      {/* PayPal Settings */}
      {settings.enablePayPal && (
        <FormSection 
          title="PayPal Settings" 
          description="Configure PayPal payment processing"
        >
          <FormRow
            label="PayPal Environment"
            htmlFor="paypalEnvironment"
            description="Select PayPal environment"
          >
            <FormSelect
              id="paypalEnvironment"
              value={settings.paypalEnvironment}
              onChange={(e) => handleChange('paypalEnvironment', e.target.value)}
              options={paypalEnvironments}
            />
          </FormRow>

          <FormRow
            label="Client ID"
            htmlFor="paypalClientId"
            description="Your PayPal client ID"
          >
            <FormInput
              id="paypalClientId"
              value={settings.paypalClientId}
              onChange={(e) => handleChange('paypalClientId', e.target.value)}
              placeholder="Enter your PayPal client ID"
            />
          </FormRow>

          <FormRow
            label="Secret Key"
            htmlFor="paypalSecretKey"
            description="Your PayPal secret key"
          >
            <FormInput
              id="paypalSecretKey"
              type="password"
              value={settings.paypalSecretKey}
              onChange={(e) => handleChange('paypalSecretKey', e.target.value)}
              placeholder="Enter your PayPal secret key"
            />
          </FormRow>
        </FormSection>
      )}

      {/* Security Settings */}
      <FormSection 
        title="Security Settings" 
        description="Configure payment security options"
      >
        <FormRow
          label="Enable SSL"
          htmlFor="enableSSL"
          description="Require SSL certificate for payments"
        >
          <FormToggle
            id="enableSSL"
            checked={settings.enableSSL}
            onChange={(e) => handleChange('enableSSL', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Fraud Detection"
          htmlFor="enableFraudDetection"
          description="Enable basic fraud detection"
        >
          <FormToggle
            id="enableFraudDetection"
            checked={settings.enableFraudDetection}
            onChange={(e) => handleChange('enableFraudDetection', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Maximum Transaction"
          htmlFor="maxTransactionAmount"
          description="Maximum amount allowed per transaction (0 for no limit)"
        >
          <FormInput
            id="maxTransactionAmount"
            type="number"
            value={settings.maxTransactionAmount}
            onChange={(e) => handleChange('maxTransactionAmount', e.target.value)}
            min="0"
            step="0.01"
          />
        </FormRow>
      </FormSection>

      {/* Checkout Settings */}
      <FormSection 
        title="Checkout Settings" 
        description="Configure checkout process options"
      >
        <FormRow
          label="Require Phone"
          htmlFor="requirePhone"
          description="Require phone number during checkout"
        >
          <FormToggle
            id="requirePhone"
            checked={settings.requirePhone}
            onChange={(e) => handleChange('requirePhone', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Require Company"
          htmlFor="requireCompany"
          description="Require company name during checkout"
        >
          <FormToggle
            id="requireCompany"
            checked={settings.requireCompany}
            onChange={(e) => handleChange('requireCompany', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Guest Checkout"
          htmlFor="allowGuestCheckout"
          description="Allow checkout without creating an account"
        >
          <FormToggle
            id="allowGuestCheckout"
            checked={settings.allowGuestCheckout}
            onChange={(e) => handleChange('allowGuestCheckout', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Terms & Conditions"
          htmlFor="termsAndConditions"
          description="Require accepting terms and conditions"
        >
          <FormToggle
            id="termsAndConditions"
            checked={settings.termsAndConditions}
            onChange={(e) => handleChange('termsAndConditions', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Order Notes"
          htmlFor="checkoutNotes"
          description="Allow customers to add notes to their order"
        >
          <FormToggle
            id="checkoutNotes"
            checked={settings.checkoutNotes}
            onChange={(e) => handleChange('checkoutNotes', e.target.checked)}
          />
        </FormRow>
      </FormSection>
    </div>
  );
} 