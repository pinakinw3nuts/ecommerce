import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface IntegrationSettingsData {
  // Analytics
  enableGoogleAnalytics: boolean;
  googleAnalyticsId: string;
  enableFacebookPixel: boolean;
  facebookPixelId: string;
  enableHotjar: boolean;
  hotjarId: string;

  // Social Media
  enableFacebookLogin: boolean;
  facebookAppId: string;
  facebookAppSecret: string;
  enableGoogleLogin: boolean;
  googleClientId: string;
  googleClientSecret: string;

  // Payment Gateways
  enableStripe: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  enablePayPal: boolean;
  paypalClientId: string;
  paypalClientSecret: string;

  // Shipping
  enableShipStation: boolean;
  shipStationApiKey: string;
  shipStationApiSecret: string;
  enableShippo: boolean;
  shippoApiKey: string;

  // Marketing
  enableMailchimp: boolean;
  mailchimpApiKey: string;
  mailchimpListId: string;
  enableSendgrid: boolean;
  sendgridApiKey: string;

  // CRM
  enableHubspot: boolean;
  hubspotApiKey: string;
  enableZendesk: boolean;
  zendeskDomain: string;
  zendeskApiToken: string;

  // Marketplace
  enableAmazon: boolean;
  amazonSellerId: string;
  amazonMarketplaceId: string;
  enableEbay: boolean;
  ebayClientId: string;
  ebayClientSecret: string;

  // Inventory
  enableErply: boolean;
  erplyClientCode: string;
  erplyUsername: string;
  erplyPassword: string;
}

export function IntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSettingsData>({
    // Analytics
    enableGoogleAnalytics: false,
    googleAnalyticsId: '',
    enableFacebookPixel: false,
    facebookPixelId: '',
    enableHotjar: false,
    hotjarId: '',

    // Social Media
    enableFacebookLogin: false,
    facebookAppId: '',
    facebookAppSecret: '',
    enableGoogleLogin: false,
    googleClientId: '',
    googleClientSecret: '',

    // Payment Gateways
    enableStripe: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    enablePayPal: false,
    paypalClientId: '',
    paypalClientSecret: '',

    // Shipping
    enableShipStation: false,
    shipStationApiKey: '',
    shipStationApiSecret: '',
    enableShippo: false,
    shippoApiKey: '',

    // Marketing
    enableMailchimp: false,
    mailchimpApiKey: '',
    mailchimpListId: '',
    enableSendgrid: false,
    sendgridApiKey: '',

    // CRM
    enableHubspot: false,
    hubspotApiKey: '',
    enableZendesk: false,
    zendeskDomain: '',
    zendeskApiToken: '',

    // Marketplace
    enableAmazon: false,
    amazonSellerId: '',
    amazonMarketplaceId: '',
    enableEbay: false,
    ebayClientId: '',
    ebayClientSecret: '',

    // Inventory
    enableErply: false,
    erplyClientCode: '',
    erplyUsername: '',
    erplyPassword: '',
  });

  const handleChange = (field: keyof IntegrationSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <FormSection 
        title="Analytics Integrations" 
        description="Configure analytics tracking tools"
      >
        <FormRow
          label="Google Analytics"
          htmlFor="enableGoogleAnalytics"
          description="Enable Google Analytics tracking"
        >
          <FormToggle
            id="enableGoogleAnalytics"
            checked={settings.enableGoogleAnalytics}
            onChange={(e) => handleChange('enableGoogleAnalytics', e.target.checked)}
          />
        </FormRow>

        {settings.enableGoogleAnalytics && (
          <FormRow
            label="Google Analytics ID"
            htmlFor="googleAnalyticsId"
            description="Your Google Analytics tracking ID"
          >
            <FormInput
              id="googleAnalyticsId"
              value={settings.googleAnalyticsId}
              onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
              placeholder="UA-XXXXXXXXX-X"
            />
          </FormRow>
        )}

        <FormRow
          label="Facebook Pixel"
          htmlFor="enableFacebookPixel"
          description="Enable Facebook Pixel tracking"
        >
          <FormToggle
            id="enableFacebookPixel"
            checked={settings.enableFacebookPixel}
            onChange={(e) => handleChange('enableFacebookPixel', e.target.checked)}
          />
        </FormRow>

        {settings.enableFacebookPixel && (
          <FormRow
            label="Facebook Pixel ID"
            htmlFor="facebookPixelId"
            description="Your Facebook Pixel ID"
          >
            <FormInput
              id="facebookPixelId"
              value={settings.facebookPixelId}
              onChange={(e) => handleChange('facebookPixelId', e.target.value)}
              placeholder="XXXXXXXXXXXXXXXXXX"
            />
          </FormRow>
        )}
      </FormSection>

      {/* Social Media */}
      <FormSection 
        title="Social Media Integrations" 
        description="Configure social login options"
      >
        <FormRow
          label="Facebook Login"
          htmlFor="enableFacebookLogin"
          description="Enable Facebook login"
        >
          <FormToggle
            id="enableFacebookLogin"
            checked={settings.enableFacebookLogin}
            onChange={(e) => handleChange('enableFacebookLogin', e.target.checked)}
          />
        </FormRow>

        {settings.enableFacebookLogin && (
          <>
            <FormRow
              label="Facebook App ID"
              htmlFor="facebookAppId"
              description="Your Facebook App ID"
            >
              <FormInput
                id="facebookAppId"
                value={settings.facebookAppId}
                onChange={(e) => handleChange('facebookAppId', e.target.value)}
                placeholder="XXXXXXXXXXXXXXXXXX"
              />
            </FormRow>

            <FormRow
              label="Facebook App Secret"
              htmlFor="facebookAppSecret"
              description="Your Facebook App Secret"
            >
              <FormInput
                id="facebookAppSecret"
                type="password"
                value={settings.facebookAppSecret}
                onChange={(e) => handleChange('facebookAppSecret', e.target.value)}
                placeholder="Enter your Facebook App Secret"
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Payment Gateways */}
      <FormSection 
        title="Payment Gateway Integrations" 
        description="Configure payment processing services"
      >
        <FormRow
          label="Stripe"
          htmlFor="enableStripe"
          description="Enable Stripe payments"
        >
          <FormToggle
            id="enableStripe"
            checked={settings.enableStripe}
            onChange={(e) => handleChange('enableStripe', e.target.checked)}
          />
        </FormRow>

        {settings.enableStripe && (
          <>
            <FormRow
              label="Stripe Publishable Key"
              htmlFor="stripePublishableKey"
              description="Your Stripe publishable key"
            >
              <FormInput
                id="stripePublishableKey"
                value={settings.stripePublishableKey}
                onChange={(e) => handleChange('stripePublishableKey', e.target.value)}
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
      </FormSection>

      {/* Shipping */}
      <FormSection 
        title="Shipping Integrations" 
        description="Configure shipping service providers"
      >
        <FormRow
          label="ShipStation"
          htmlFor="enableShipStation"
          description="Enable ShipStation integration"
        >
          <FormToggle
            id="enableShipStation"
            checked={settings.enableShipStation}
            onChange={(e) => handleChange('enableShipStation', e.target.checked)}
          />
        </FormRow>

        {settings.enableShipStation && (
          <>
            <FormRow
              label="ShipStation API Key"
              htmlFor="shipStationApiKey"
              description="Your ShipStation API key"
            >
              <FormInput
                id="shipStationApiKey"
                value={settings.shipStationApiKey}
                onChange={(e) => handleChange('shipStationApiKey', e.target.value)}
                placeholder="Enter your ShipStation API key"
              />
            </FormRow>

            <FormRow
              label="ShipStation API Secret"
              htmlFor="shipStationApiSecret"
              description="Your ShipStation API secret"
            >
              <FormInput
                id="shipStationApiSecret"
                type="password"
                value={settings.shipStationApiSecret}
                onChange={(e) => handleChange('shipStationApiSecret', e.target.value)}
                placeholder="Enter your ShipStation API secret"
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Marketing */}
      <FormSection 
        title="Marketing Integrations" 
        description="Configure marketing and email services"
      >
        <FormRow
          label="Mailchimp"
          htmlFor="enableMailchimp"
          description="Enable Mailchimp integration"
        >
          <FormToggle
            id="enableMailchimp"
            checked={settings.enableMailchimp}
            onChange={(e) => handleChange('enableMailchimp', e.target.checked)}
          />
        </FormRow>

        {settings.enableMailchimp && (
          <>
            <FormRow
              label="Mailchimp API Key"
              htmlFor="mailchimpApiKey"
              description="Your Mailchimp API key"
            >
              <FormInput
                id="mailchimpApiKey"
                value={settings.mailchimpApiKey}
                onChange={(e) => handleChange('mailchimpApiKey', e.target.value)}
                placeholder="Enter your Mailchimp API key"
              />
            </FormRow>

            <FormRow
              label="Mailchimp List ID"
              htmlFor="mailchimpListId"
              description="Your Mailchimp audience list ID"
            >
              <FormInput
                id="mailchimpListId"
                value={settings.mailchimpListId}
                onChange={(e) => handleChange('mailchimpListId', e.target.value)}
                placeholder="Enter your Mailchimp list ID"
              />
            </FormRow>
          </>
        )}
      </FormSection>
    </div>
  );
} 