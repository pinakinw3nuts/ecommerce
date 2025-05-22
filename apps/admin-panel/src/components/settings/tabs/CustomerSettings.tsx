import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface CustomerSettingsData {
  // Account Settings
  enableCustomerAccounts: boolean;
  allowRegistration: boolean;
  requireVerification: boolean;
  generateUsername: boolean;
  minimumPasswordLength: string;
  passwordComplexity: string;
  autoLoginAfterRegistration: boolean;

  // Privacy Settings
  enablePrivacyPolicy: boolean;
  privacyPolicyUrl: string;
  enableCookieNotice: boolean;
  cookieNoticeDuration: string;
  dataRetentionPeriod: string;
  allowDataExport: boolean;
  allowDataDeletion: boolean;

  // Customer Experience
  enableWishlist: boolean;
  enableProductReviews: boolean;
  requirePurchaseToReview: boolean;
  enableCustomerNotes: boolean;
  showOrderHistory: boolean;
  showDownloadableProducts: boolean;

  // Communication Preferences
  enableNewsletterSignup: boolean;
  defaultNewsletterStatus: boolean;
  allowMarketingEmails: boolean;
  doubleOptIn: boolean;
  unsubscribeMethod: string;

  // Account Management
  inactiveAccountDays: string;
  accountDeletionPolicy: string;
  loginAttempts: string;
  lockoutDuration: string;
  passwordResetExpiry: string;

  // Customer Support
  enableSupport: boolean;
  supportEmail: string;
  supportHours: string;
  enableLiveChat: boolean;
  enableTicketSystem: boolean;
  autoResponseEmail: boolean;
}

const passwordComplexityOptions = [
  { value: 'low', label: 'Low (letters and numbers)' },
  { value: 'medium', label: 'Medium (mixed case and numbers)' },
  { value: 'high', label: 'High (mixed case, numbers, symbols)' },
];

const unsubscribeMethods = [
  { value: 'one_click', label: 'One-click unsubscribe' },
  { value: 'login_required', label: 'Login required' },
  { value: 'confirmation_required', label: 'Confirmation required' },
];

const accountDeletionPolicies = [
  { value: 'immediate', label: 'Immediate deletion' },
  { value: 'soft_delete', label: 'Soft delete (30 days recovery)' },
  { value: 'archive', label: 'Archive account' },
];

export function CustomerSettings() {
  const [settings, setSettings] = useState<CustomerSettingsData>({
    // Account Settings
    enableCustomerAccounts: true,
    allowRegistration: true,
    requireVerification: true,
    generateUsername: false,
    minimumPasswordLength: '8',
    passwordComplexity: 'medium',
    autoLoginAfterRegistration: true,

    // Privacy Settings
    enablePrivacyPolicy: true,
    privacyPolicyUrl: '',
    enableCookieNotice: true,
    cookieNoticeDuration: '30',
    dataRetentionPeriod: '365',
    allowDataExport: true,
    allowDataDeletion: true,

    // Customer Experience
    enableWishlist: true,
    enableProductReviews: true,
    requirePurchaseToReview: true,
    enableCustomerNotes: true,
    showOrderHistory: true,
    showDownloadableProducts: true,

    // Communication Preferences
    enableNewsletterSignup: true,
    defaultNewsletterStatus: false,
    allowMarketingEmails: true,
    doubleOptIn: true,
    unsubscribeMethod: 'one_click',

    // Account Management
    inactiveAccountDays: '365',
    accountDeletionPolicy: 'soft_delete',
    loginAttempts: '5',
    lockoutDuration: '30',
    passwordResetExpiry: '24',

    // Customer Support
    enableSupport: true,
    supportEmail: '',
    supportHours: '9:00 AM - 5:00 PM EST',
    enableLiveChat: false,
    enableTicketSystem: true,
    autoResponseEmail: true,
  });

  const handleChange = (field: keyof CustomerSettingsData, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Account Settings */}
      <FormSection 
        title="Account Settings" 
        description="Configure customer account options"
      >
        <FormRow
          label="Enable Customer Accounts"
          htmlFor="enableCustomerAccounts"
          description="Allow customers to create accounts"
        >
          <FormToggle
            id="enableCustomerAccounts"
            checked={settings.enableCustomerAccounts}
            onChange={(e) => handleChange('enableCustomerAccounts', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Registration"
          htmlFor="allowRegistration"
          description="Allow new customer registrations"
        >
          <FormToggle
            id="allowRegistration"
            checked={settings.allowRegistration}
            onChange={(e) => handleChange('allowRegistration', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Require Verification"
          htmlFor="requireVerification"
          description="Require email verification for new accounts"
        >
          <FormToggle
            id="requireVerification"
            checked={settings.requireVerification}
            onChange={(e) => handleChange('requireVerification', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Generate Username"
          htmlFor="generateUsername"
          description="Automatically generate usernames for new accounts"
        >
          <FormToggle
            id="generateUsername"
            checked={settings.generateUsername}
            onChange={(e) => handleChange('generateUsername', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Minimum Password Length"
          htmlFor="minimumPasswordLength"
          description="Minimum number of characters required for passwords"
        >
          <FormInput
            id="minimumPasswordLength"
            type="number"
            value={settings.minimumPasswordLength}
            onChange={(e) => handleChange('minimumPasswordLength', e.target.value)}
            min="6"
            max="32"
          />
        </FormRow>

        <FormRow
          label="Password Complexity"
          htmlFor="passwordComplexity"
          description="Required password complexity level"
        >
          <FormSelect
            id="passwordComplexity"
            value={settings.passwordComplexity}
            onChange={(e) => handleChange('passwordComplexity', e.target.value)}
            options={passwordComplexityOptions}
          />
        </FormRow>
      </FormSection>

      {/* Privacy Settings */}
      <FormSection 
        title="Privacy Settings" 
        description="Configure customer privacy and data protection"
      >
        <FormRow
          label="Privacy Policy"
          htmlFor="enablePrivacyPolicy"
          description="Require privacy policy acceptance"
        >
          <FormToggle
            id="enablePrivacyPolicy"
            checked={settings.enablePrivacyPolicy}
            onChange={(e) => handleChange('enablePrivacyPolicy', e.target.checked)}
          />
        </FormRow>

        {settings.enablePrivacyPolicy && (
          <FormRow
            label="Privacy Policy URL"
            htmlFor="privacyPolicyUrl"
            description="Link to your privacy policy page"
          >
            <FormInput
              id="privacyPolicyUrl"
              value={settings.privacyPolicyUrl}
              onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)}
              placeholder="https://..."
            />
          </FormRow>
        )}

        <FormRow
          label="Cookie Notice"
          htmlFor="enableCookieNotice"
          description="Show cookie consent notice"
        >
          <FormToggle
            id="enableCookieNotice"
            checked={settings.enableCookieNotice}
            onChange={(e) => handleChange('enableCookieNotice', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Data Retention"
          htmlFor="dataRetentionPeriod"
          description="Days to retain customer data"
        >
          <FormInput
            id="dataRetentionPeriod"
            type="number"
            value={settings.dataRetentionPeriod}
            onChange={(e) => handleChange('dataRetentionPeriod', e.target.value)}
            min="30"
          />
        </FormRow>

        <FormRow
          label="Data Export"
          htmlFor="allowDataExport"
          description="Allow customers to export their data"
        >
          <FormToggle
            id="allowDataExport"
            checked={settings.allowDataExport}
            onChange={(e) => handleChange('allowDataExport', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Data Deletion"
          htmlFor="allowDataDeletion"
          description="Allow customers to request data deletion"
        >
          <FormToggle
            id="allowDataDeletion"
            checked={settings.allowDataDeletion}
            onChange={(e) => handleChange('allowDataDeletion', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Customer Experience */}
      <FormSection 
        title="Customer Experience" 
        description="Configure customer features and capabilities"
      >
        <FormRow
          label="Wishlist"
          htmlFor="enableWishlist"
          description="Enable customer wishlists"
        >
          <FormToggle
            id="enableWishlist"
            checked={settings.enableWishlist}
            onChange={(e) => handleChange('enableWishlist', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Product Reviews"
          htmlFor="enableProductReviews"
          description="Enable customer product reviews"
        >
          <FormToggle
            id="enableProductReviews"
            checked={settings.enableProductReviews}
            onChange={(e) => handleChange('enableProductReviews', e.target.checked)}
          />
        </FormRow>

        {settings.enableProductReviews && (
          <FormRow
            label="Require Purchase"
            htmlFor="requirePurchaseToReview"
            description="Require purchase to leave reviews"
          >
            <FormToggle
              id="requirePurchaseToReview"
              checked={settings.requirePurchaseToReview}
              onChange={(e) => handleChange('requirePurchaseToReview', e.target.checked)}
            />
          </FormRow>
        )}

        <FormRow
          label="Customer Notes"
          htmlFor="enableCustomerNotes"
          description="Allow customers to add notes to orders"
        >
          <FormToggle
            id="enableCustomerNotes"
            checked={settings.enableCustomerNotes}
            onChange={(e) => handleChange('enableCustomerNotes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Order History"
          htmlFor="showOrderHistory"
          description="Show complete order history"
        >
          <FormToggle
            id="showOrderHistory"
            checked={settings.showOrderHistory}
            onChange={(e) => handleChange('showOrderHistory', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Communication Preferences */}
      <FormSection 
        title="Communication Preferences" 
        description="Configure customer communication settings"
      >
        <FormRow
          label="Newsletter Signup"
          htmlFor="enableNewsletterSignup"
          description="Enable newsletter subscription"
        >
          <FormToggle
            id="enableNewsletterSignup"
            checked={settings.enableNewsletterSignup}
            onChange={(e) => handleChange('enableNewsletterSignup', e.target.checked)}
          />
        </FormRow>

        {settings.enableNewsletterSignup && (
          <>
            <FormRow
              label="Default Status"
              htmlFor="defaultNewsletterStatus"
              description="Default newsletter subscription status"
            >
              <FormToggle
                id="defaultNewsletterStatus"
                checked={settings.defaultNewsletterStatus}
                onChange={(e) => handleChange('defaultNewsletterStatus', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Double Opt-in"
              htmlFor="doubleOptIn"
              description="Require email confirmation for newsletter"
            >
              <FormToggle
                id="doubleOptIn"
                checked={settings.doubleOptIn}
                onChange={(e) => handleChange('doubleOptIn', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Unsubscribe Method"
              htmlFor="unsubscribeMethod"
              description="How customers can unsubscribe"
            >
              <FormSelect
                id="unsubscribeMethod"
                value={settings.unsubscribeMethod}
                onChange={(e) => handleChange('unsubscribeMethod', e.target.value)}
                options={unsubscribeMethods}
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Account Management */}
      <FormSection 
        title="Account Management" 
        description="Configure account security and management"
      >
        <FormRow
          label="Inactive Account Period"
          htmlFor="inactiveAccountDays"
          description="Days before account is marked inactive"
        >
          <FormInput
            id="inactiveAccountDays"
            type="number"
            value={settings.inactiveAccountDays}
            onChange={(e) => handleChange('inactiveAccountDays', e.target.value)}
            min="30"
          />
        </FormRow>

        <FormRow
          label="Account Deletion Policy"
          htmlFor="accountDeletionPolicy"
          description="How to handle account deletions"
        >
          <FormSelect
            id="accountDeletionPolicy"
            value={settings.accountDeletionPolicy}
            onChange={(e) => handleChange('accountDeletionPolicy', e.target.value)}
            options={accountDeletionPolicies}
          />
        </FormRow>

        <FormRow
          label="Login Attempts"
          htmlFor="loginAttempts"
          description="Maximum failed login attempts before lockout"
        >
          <FormInput
            id="loginAttempts"
            type="number"
            value={settings.loginAttempts}
            onChange={(e) => handleChange('loginAttempts', e.target.value)}
            min="3"
            max="10"
          />
        </FormRow>

        <FormRow
          label="Lockout Duration"
          htmlFor="lockoutDuration"
          description="Minutes to lock account after failed attempts"
        >
          <FormInput
            id="lockoutDuration"
            type="number"
            value={settings.lockoutDuration}
            onChange={(e) => handleChange('lockoutDuration', e.target.value)}
            min="5"
          />
        </FormRow>
      </FormSection>

      {/* Customer Support */}
      <FormSection 
        title="Customer Support" 
        description="Configure customer support options"
      >
        <FormRow
          label="Enable Support"
          htmlFor="enableSupport"
          description="Enable customer support features"
        >
          <FormToggle
            id="enableSupport"
            checked={settings.enableSupport}
            onChange={(e) => handleChange('enableSupport', e.target.checked)}
          />
        </FormRow>

        {settings.enableSupport && (
          <>
            <FormRow
              label="Support Email"
              htmlFor="supportEmail"
              description="Primary support email address"
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
              label="Support Hours"
              htmlFor="supportHours"
              description="Business hours for support"
            >
              <FormInput
                id="supportHours"
                value={settings.supportHours}
                onChange={(e) => handleChange('supportHours', e.target.value)}
                placeholder="e.g., 9:00 AM - 5:00 PM EST"
              />
            </FormRow>

            <FormRow
              label="Live Chat"
              htmlFor="enableLiveChat"
              description="Enable live chat support"
            >
              <FormToggle
                id="enableLiveChat"
                checked={settings.enableLiveChat}
                onChange={(e) => handleChange('enableLiveChat', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Ticket System"
              htmlFor="enableTicketSystem"
              description="Enable support ticket system"
            >
              <FormToggle
                id="enableTicketSystem"
                checked={settings.enableTicketSystem}
                onChange={(e) => handleChange('enableTicketSystem', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Auto-Response"
              htmlFor="autoResponseEmail"
              description="Send automatic response to support requests"
            >
              <FormToggle
                id="autoResponseEmail"
                checked={settings.autoResponseEmail}
                onChange={(e) => handleChange('autoResponseEmail', e.target.checked)}
              />
            </FormRow>
          </>
        )}
      </FormSection>
    </div>
  );
} 