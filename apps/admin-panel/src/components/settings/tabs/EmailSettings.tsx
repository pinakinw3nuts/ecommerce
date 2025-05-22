import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface EmailSettingsData {
  // Email Provider
  emailProvider: string;
  // SMTP Settings
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  // SendGrid Settings
  sendgridApiKey: string;
  sendgridTemplateId: string;
  // Mailchimp Settings
  mailchimpApiKey: string;
  mailchimpListId: string;
  mailchimpFromDomain: string;
  // Amazon SES Settings
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
  sesDomain: string;

  // Common Settings
  fromEmail: string;
  fromName: string;
  replyToEmail: string;

  // Email Templates
  enableCustomTemplates: boolean;
  headerImage: string;
  emailFooter: string;
  brandColor: string;
  useCompanyLogo: boolean;
  previewLanguage: string;
  templateVariables: string;

  // Notification Settings
  adminNewOrder: boolean;
  adminCanceledOrder: boolean;
  adminFailedOrder: boolean;
  adminNewCustomer: boolean;
  adminLowStock: boolean;
  customerOrderConfirmation: boolean;
  customerOrderShipped: boolean;
  customerOrderDelivered: boolean;
  customerOrderCanceled: boolean;
  customerAccountCreated: boolean;
  customerPasswordReset: boolean;
  customerAbandonedCart: boolean;

  // Email Preferences
  batchEmails: boolean;
  emailBatchSize: string;
  emailQueueInterval: string;
  maxRetries: string;
  trackEmailOpens: boolean;
  trackEmailClicks: boolean;
  
  // Email Scheduling
  enableScheduling: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timeZone: string;
  maxEmailsPerHour: string;
  
  // Testing
  enableTestMode: boolean;
  testEmail: string;
  enableSpamCheck: boolean;
  testTemplateVariables: string;
}

const emailProviders = [
  { value: 'smtp', label: 'Custom SMTP Server' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'amazonses', label: 'Amazon SES' },
];

const encryptionTypes = [
  { value: 'none', label: 'None' },
  { value: 'ssl', label: 'SSL' },
  { value: 'tls', label: 'TLS' },
];

const awsRegions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
];

const timeZones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

const previewLanguages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettingsData>({
    // Email Provider
    emailProvider: 'smtp',
    // SMTP Settings
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    // SendGrid Settings
    sendgridApiKey: '',
    sendgridTemplateId: '',
    // Mailchimp Settings
    mailchimpApiKey: '',
    mailchimpListId: '',
    mailchimpFromDomain: '',
    // Amazon SES Settings
    awsAccessKey: '',
    awsSecretKey: '',
    awsRegion: 'us-east-1',
    sesDomain: '',

    // Common Settings
    fromEmail: '',
    fromName: '',
    replyToEmail: '',

    // Email Templates
    enableCustomTemplates: true,
    headerImage: '',
    emailFooter: '',
    brandColor: '#000000',
    useCompanyLogo: true,
    previewLanguage: 'en',
    templateVariables: '{\n  "storeName": "{{storeName}}",\n  "orderNumber": "{{orderNumber}}"\n}',

    // Notification Settings
    adminNewOrder: true,
    adminCanceledOrder: true,
    adminFailedOrder: true,
    adminNewCustomer: true,
    adminLowStock: true,
    customerOrderConfirmation: true,
    customerOrderShipped: true,
    customerOrderDelivered: true,
    customerOrderCanceled: true,
    customerAccountCreated: true,
    customerPasswordReset: true,
    customerAbandonedCart: true,

    // Email Preferences
    batchEmails: true,
    emailBatchSize: '50',
    emailQueueInterval: '5',
    maxRetries: '3',
    trackEmailOpens: true,
    trackEmailClicks: true,

    // Email Scheduling
    enableScheduling: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    timeZone: 'UTC',
    maxEmailsPerHour: '100',

    // Testing
    enableTestMode: false,
    testEmail: '',
    enableSpamCheck: true,
    testTemplateVariables: '{\n  "orderNumber": "TEST-123",\n  "customerName": "John Doe"\n}',
  });

  const handleChange = (field: keyof EmailSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Email Provider */}
      <FormSection 
        title="Email Provider" 
        description="Configure your email service provider settings"
      >
        <FormRow
          label="Email Provider"
          htmlFor="emailProvider"
          description="Select your email service provider"
        >
          <FormSelect
            id="emailProvider"
            value={settings.emailProvider}
            onChange={(e) => handleChange('emailProvider', e.target.value)}
            options={emailProviders}
          />
        </FormRow>

        {settings.emailProvider === 'smtp' && (
          <>
            <FormRow
              label="SMTP Host"
              htmlFor="smtpHost"
              description="Your SMTP server hostname"
            >
              <FormInput
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => handleChange('smtpHost', e.target.value)}
                placeholder="smtp.example.com"
              />
            </FormRow>

            <FormRow
              label="SMTP Port"
              htmlFor="smtpPort"
              description="Your SMTP server port"
            >
              <FormInput
                id="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleChange('smtpPort', e.target.value)}
                placeholder="587"
              />
            </FormRow>

            <FormRow
              label="SMTP Username"
              htmlFor="smtpUsername"
              description="Your SMTP authentication username"
            >
              <FormInput
                id="smtpUsername"
                value={settings.smtpUsername}
                onChange={(e) => handleChange('smtpUsername', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="SMTP Password"
              htmlFor="smtpPassword"
              description="Your SMTP authentication password"
            >
              <FormInput
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => handleChange('smtpPassword', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="Encryption"
              htmlFor="smtpEncryption"
              description="Select encryption method"
            >
              <FormSelect
                id="smtpEncryption"
                value={settings.smtpEncryption}
                onChange={(e) => handleChange('smtpEncryption', e.target.value)}
                options={encryptionTypes}
              />
            </FormRow>
          </>
        )}

        {settings.emailProvider === 'sendgrid' && (
          <>
            <FormRow
              label="API Key"
              htmlFor="sendgridApiKey"
              description="Your SendGrid API key"
            >
              <FormInput
                id="sendgridApiKey"
                type="password"
                value={settings.sendgridApiKey}
                onChange={(e) => handleChange('sendgridApiKey', e.target.value)}
                placeholder="SG.xxxxxx"
              />
            </FormRow>

            <FormRow
              label="Template ID"
              htmlFor="sendgridTemplateId"
              description="Default template ID for transactional emails"
            >
              <FormInput
                id="sendgridTemplateId"
                value={settings.sendgridTemplateId}
                onChange={(e) => handleChange('sendgridTemplateId', e.target.value)}
                placeholder="d-xxxxxx"
              />
            </FormRow>
          </>
        )}

        {settings.emailProvider === 'mailchimp' && (
          <>
            <FormRow
              label="API Key"
              htmlFor="mailchimpApiKey"
              description="Your Mailchimp API key"
            >
              <FormInput
                id="mailchimpApiKey"
                type="password"
                value={settings.mailchimpApiKey}
                onChange={(e) => handleChange('mailchimpApiKey', e.target.value)}
                placeholder="xxxxxx-usxx"
              />
            </FormRow>

            <FormRow
              label="List ID"
              htmlFor="mailchimpListId"
              description="Default audience list ID"
            >
              <FormInput
                id="mailchimpListId"
                value={settings.mailchimpListId}
                onChange={(e) => handleChange('mailchimpListId', e.target.value)}
                placeholder="xxxxxx"
              />
            </FormRow>

            <FormRow
              label="From Domain"
              htmlFor="mailchimpFromDomain"
              description="Verified sending domain"
            >
              <FormInput
                id="mailchimpFromDomain"
                value={settings.mailchimpFromDomain}
                onChange={(e) => handleChange('mailchimpFromDomain', e.target.value)}
                placeholder="example.com"
              />
            </FormRow>
          </>
        )}

        {settings.emailProvider === 'amazonses' && (
          <>
            <FormRow
              label="AWS Access Key"
              htmlFor="awsAccessKey"
              description="Your AWS access key ID"
            >
              <FormInput
                id="awsAccessKey"
                type="password"
                value={settings.awsAccessKey}
                onChange={(e) => handleChange('awsAccessKey', e.target.value)}
                placeholder="AKIA..."
              />
            </FormRow>

            <FormRow
              label="AWS Secret Key"
              htmlFor="awsSecretKey"
              description="Your AWS secret access key"
            >
              <FormInput
                id="awsSecretKey"
                type="password"
                value={settings.awsSecretKey}
                onChange={(e) => handleChange('awsSecretKey', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="AWS Region"
              htmlFor="awsRegion"
              description="Select AWS region for SES"
            >
              <FormSelect
                id="awsRegion"
                value={settings.awsRegion}
                onChange={(e) => handleChange('awsRegion', e.target.value)}
                options={awsRegions}
              />
            </FormRow>

            <FormRow
              label="SES Domain"
              htmlFor="sesDomain"
              description="Verified SES sending domain"
            >
              <FormInput
                id="sesDomain"
                value={settings.sesDomain}
                onChange={(e) => handleChange('sesDomain', e.target.value)}
                placeholder="mail.example.com"
              />
            </FormRow>
          </>
        )}

        <FormRow
          label="From Email"
          htmlFor="fromEmail"
          description="Default sender email address"
        >
          <FormInput
            id="fromEmail"
            type="email"
            value={settings.fromEmail}
            onChange={(e) => handleChange('fromEmail', e.target.value)}
            placeholder="noreply@example.com"
          />
        </FormRow>

        <FormRow
          label="From Name"
          htmlFor="fromName"
          description="Default sender name"
        >
          <FormInput
            id="fromName"
            value={settings.fromName}
            onChange={(e) => handleChange('fromName', e.target.value)}
            placeholder="Your Store Name"
          />
        </FormRow>

        <FormRow
          label="Reply-To Email"
          htmlFor="replyToEmail"
          description="Email address for customer replies"
        >
          <FormInput
            id="replyToEmail"
            type="email"
            value={settings.replyToEmail}
            onChange={(e) => handleChange('replyToEmail', e.target.value)}
            placeholder="support@example.com"
          />
        </FormRow>
      </FormSection>

      {/* Email Templates */}
      <FormSection 
        title="Email Templates" 
        description="Customize your email template appearance"
      >
        <FormRow
          label="Custom Templates"
          htmlFor="enableCustomTemplates"
          description="Enable custom email templates"
        >
          <FormToggle
            id="enableCustomTemplates"
            checked={settings.enableCustomTemplates}
            onChange={(e) => handleChange('enableCustomTemplates', e.target.checked)}
          />
        </FormRow>

        {settings.enableCustomTemplates && (
          <>
            <FormRow
              label="Header Image"
              htmlFor="headerImage"
              description="URL for email header image"
            >
              <FormInput
                id="headerImage"
                value={settings.headerImage}
                onChange={(e) => handleChange('headerImage', e.target.value)}
                placeholder="https://..."
              />
            </FormRow>

            <FormRow
              label="Email Footer"
              htmlFor="emailFooter"
              description="Custom footer text for all emails"
            >
              <FormTextarea
                id="emailFooter"
                value={settings.emailFooter}
                onChange={(e) => handleChange('emailFooter', e.target.value)}
                placeholder="Enter footer text..."
              />
            </FormRow>

            <FormRow
              label="Brand Color"
              htmlFor="brandColor"
              description="Primary color for email templates"
            >
              <FormInput
                id="brandColor"
                type="color"
                value={settings.brandColor}
                onChange={(e) => handleChange('brandColor', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="Use Company Logo"
              htmlFor="useCompanyLogo"
              description="Include company logo in emails"
            >
              <FormToggle
                id="useCompanyLogo"
                checked={settings.useCompanyLogo}
                onChange={(e) => handleChange('useCompanyLogo', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Preview Language"
              htmlFor="previewLanguage"
              description="Language for template preview"
            >
              <FormSelect
                id="previewLanguage"
                value={settings.previewLanguage}
                onChange={(e) => handleChange('previewLanguage', e.target.value)}
                options={previewLanguages}
              />
            </FormRow>

            <FormRow
              label="Template Variables"
              htmlFor="templateVariables"
              description="Define available template variables"
            >
              <FormTextarea
                id="templateVariables"
                value={settings.templateVariables}
                onChange={(e) => handleChange('templateVariables', e.target.value)}
                placeholder="Enter JSON format variables..."
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Notification Settings */}
      <FormSection 
        title="Notification Settings" 
        description="Configure email notifications"
      >
        <h4 className="text-sm font-medium text-gray-900 mb-4">Admin Notifications</h4>
        <FormRow
          label="New Order"
          htmlFor="adminNewOrder"
          description="Notify admin of new orders"
        >
          <FormToggle
            id="adminNewOrder"
            checked={settings.adminNewOrder}
            onChange={(e) => handleChange('adminNewOrder', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Canceled Order"
          htmlFor="adminCanceledOrder"
          description="Notify admin of canceled orders"
        >
          <FormToggle
            id="adminCanceledOrder"
            checked={settings.adminCanceledOrder}
            onChange={(e) => handleChange('adminCanceledOrder', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Failed Order"
          htmlFor="adminFailedOrder"
          description="Notify admin of failed orders"
        >
          <FormToggle
            id="adminFailedOrder"
            checked={settings.adminFailedOrder}
            onChange={(e) => handleChange('adminFailedOrder', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="New Customer"
          htmlFor="adminNewCustomer"
          description="Notify admin of new customer registrations"
        >
          <FormToggle
            id="adminNewCustomer"
            checked={settings.adminNewCustomer}
            onChange={(e) => handleChange('adminNewCustomer', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Low Stock"
          htmlFor="adminLowStock"
          description="Notify admin of low stock products"
        >
          <FormToggle
            id="adminLowStock"
            checked={settings.adminLowStock}
            onChange={(e) => handleChange('adminLowStock', e.target.checked)}
          />
        </FormRow>

        <h4 className="text-sm font-medium text-gray-900 mt-8 mb-4">Customer Notifications</h4>
        <FormRow
          label="Order Confirmation"
          htmlFor="customerOrderConfirmation"
          description="Send order confirmation emails"
        >
          <FormToggle
            id="customerOrderConfirmation"
            checked={settings.customerOrderConfirmation}
            onChange={(e) => handleChange('customerOrderConfirmation', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Order Shipped"
          htmlFor="customerOrderShipped"
          description="Send order shipped notifications"
        >
          <FormToggle
            id="customerOrderShipped"
            checked={settings.customerOrderShipped}
            onChange={(e) => handleChange('customerOrderShipped', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Order Delivered"
          htmlFor="customerOrderDelivered"
          description="Send order delivered notifications"
        >
          <FormToggle
            id="customerOrderDelivered"
            checked={settings.customerOrderDelivered}
            onChange={(e) => handleChange('customerOrderDelivered', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Order Canceled"
          htmlFor="customerOrderCanceled"
          description="Send order cancellation notifications"
        >
          <FormToggle
            id="customerOrderCanceled"
            checked={settings.customerOrderCanceled}
            onChange={(e) => handleChange('customerOrderCanceled', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Account Created"
          htmlFor="customerAccountCreated"
          description="Send welcome emails to new customers"
        >
          <FormToggle
            id="customerAccountCreated"
            checked={settings.customerAccountCreated}
            onChange={(e) => handleChange('customerAccountCreated', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Password Reset"
          htmlFor="customerPasswordReset"
          description="Send password reset notifications"
        >
          <FormToggle
            id="customerPasswordReset"
            checked={settings.customerPasswordReset}
            onChange={(e) => handleChange('customerPasswordReset', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Abandoned Cart"
          htmlFor="customerAbandonedCart"
          description="Send abandoned cart reminders"
        >
          <FormToggle
            id="customerAbandonedCart"
            checked={settings.customerAbandonedCart}
            onChange={(e) => handleChange('customerAbandonedCart', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Email Preferences */}
      <FormSection 
        title="Email Preferences" 
        description="Configure email sending preferences"
      >
        <FormRow
          label="Batch Emails"
          htmlFor="batchEmails"
          description="Send emails in batches"
        >
          <FormToggle
            id="batchEmails"
            checked={settings.batchEmails}
            onChange={(e) => handleChange('batchEmails', e.target.checked)}
          />
        </FormRow>

        {settings.batchEmails && (
          <>
            <FormRow
              label="Batch Size"
              htmlFor="emailBatchSize"
              description="Number of emails per batch"
            >
              <FormInput
                id="emailBatchSize"
                type="number"
                value={settings.emailBatchSize}
                onChange={(e) => handleChange('emailBatchSize', e.target.value)}
                min="10"
                max="100"
              />
            </FormRow>

            <FormRow
              label="Queue Interval"
              htmlFor="emailQueueInterval"
              description="Minutes between email batches"
            >
              <FormInput
                id="emailQueueInterval"
                type="number"
                value={settings.emailQueueInterval}
                onChange={(e) => handleChange('emailQueueInterval', e.target.value)}
                min="1"
                max="60"
              />
            </FormRow>
          </>
        )}

        <FormRow
          label="Max Retries"
          htmlFor="maxRetries"
          description="Maximum delivery retry attempts"
        >
          <FormInput
            id="maxRetries"
            type="number"
            value={settings.maxRetries}
            onChange={(e) => handleChange('maxRetries', e.target.value)}
            min="1"
            max="5"
          />
        </FormRow>

        <FormRow
          label="Track Opens"
          htmlFor="trackEmailOpens"
          description="Track email open rates"
        >
          <FormToggle
            id="trackEmailOpens"
            checked={settings.trackEmailOpens}
            onChange={(e) => handleChange('trackEmailOpens', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Track Clicks"
          htmlFor="trackEmailClicks"
          description="Track email link clicks"
        >
          <FormToggle
            id="trackEmailClicks"
            checked={settings.trackEmailClicks}
            onChange={(e) => handleChange('trackEmailClicks', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Email Scheduling */}
      <FormSection 
        title="Email Scheduling" 
        description="Configure email sending schedule"
      >
        <FormRow
          label="Enable Scheduling"
          htmlFor="enableScheduling"
          description="Schedule email sending times"
        >
          <FormToggle
            id="enableScheduling"
            checked={settings.enableScheduling}
            onChange={(e) => handleChange('enableScheduling', e.target.checked)}
          />
        </FormRow>

        {settings.enableScheduling && (
          <>
            <FormRow
              label="Quiet Hours Start"
              htmlFor="quietHoursStart"
              description="Start time for quiet hours"
            >
              <FormInput
                id="quietHoursStart"
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => handleChange('quietHoursStart', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="Quiet Hours End"
              htmlFor="quietHoursEnd"
              description="End time for quiet hours"
            >
              <FormInput
                id="quietHoursEnd"
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
              />
            </FormRow>

            <FormRow
              label="Time Zone"
              htmlFor="timeZone"
              description="Time zone for scheduling"
            >
              <FormSelect
                id="timeZone"
                value={settings.timeZone}
                onChange={(e) => handleChange('timeZone', e.target.value)}
                options={timeZones}
              />
            </FormRow>

            <FormRow
              label="Max Emails per Hour"
              htmlFor="maxEmailsPerHour"
              description="Rate limiting for email sending"
            >
              <FormInput
                id="maxEmailsPerHour"
                type="number"
                value={settings.maxEmailsPerHour}
                onChange={(e) => handleChange('maxEmailsPerHour', e.target.value)}
                min="1"
                max="1000"
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Enhanced Testing Section */}
      <FormSection 
        title="Testing" 
        description="Configure email testing options"
      >
        <FormRow
          label="Test Mode"
          htmlFor="enableTestMode"
          description="Enable email testing mode"
        >
          <FormToggle
            id="enableTestMode"
            checked={settings.enableTestMode}
            onChange={(e) => handleChange('enableTestMode', e.target.checked)}
          />
        </FormRow>

        {settings.enableTestMode && (
          <>
            <FormRow
              label="Test Email"
              htmlFor="testEmail"
              description="Email address for testing"
            >
              <FormInput
                id="testEmail"
                type="email"
                value={settings.testEmail}
                onChange={(e) => handleChange('testEmail', e.target.value)}
                placeholder="test@example.com"
              />
            </FormRow>

            <FormRow
              label="Spam Check"
              htmlFor="enableSpamCheck"
              description="Check emails for spam triggers"
            >
              <FormToggle
                id="enableSpamCheck"
                checked={settings.enableSpamCheck}
                onChange={(e) => handleChange('enableSpamCheck', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Test Variables"
              htmlFor="testTemplateVariables"
              description="Test data for template variables"
            >
              <FormTextarea
                id="testTemplateVariables"
                value={settings.testTemplateVariables}
                onChange={(e) => handleChange('testTemplateVariables', e.target.value)}
                placeholder="Enter test JSON data..."
              />
            </FormRow>
          </>
        )}
      </FormSection>
    </div>
  );
} 