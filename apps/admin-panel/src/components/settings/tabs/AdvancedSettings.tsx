import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface AdvancedSettingsData {
  // Performance
  enableCaching: boolean;
  cacheLifetime: string;
  minifyAssets: boolean;
  enableLazyLoading: boolean;
  imageOptimization: boolean;
  maxImageSize: string;

  // Security
  enableSSL: boolean;
  forceSSL: boolean;
  enableCaptcha: boolean;
  captchaType: string;
  maxLoginAttempts: string;
  passwordPolicy: string;
  enableTwoFactor: boolean;
  ipBlacklist: string[];
  
  // Logging
  enableErrorLogging: boolean;
  logRetention: string;
  enableAuditLog: boolean;
  auditLogRetention: string;
  logLevel: string;
  enableDebugMode: boolean;

  // Database
  enableBackups: boolean;
  backupSchedule: string;
  backupRetention: string;
  optimizeTables: boolean;
  tableOptimizationSchedule: string;

  // API
  enableAPI: boolean;
  apiRateLimit: string;
  apiTokenExpiry: string;
  enableWebhooks: boolean;
  webhookEndpoints: string[];

  // Development
  enableDevMode: boolean;
  showDebugBar: boolean;
  enableTestingTools: boolean;
  testingEmail: string;
  sandboxMode: boolean;

  // Maintenance
  enableMaintenance: boolean;
  maintenanceMessage: string;
  allowedIPs: string[];
  scheduledMaintenance: boolean;
  maintenanceWindow: string;
}

export function AdvancedSettings() {
  const [settings, setSettings] = useState<AdvancedSettingsData>({
    // Performance
    enableCaching: true,
    cacheLifetime: '3600',
    minifyAssets: true,
    enableLazyLoading: true,
    imageOptimization: true,
    maxImageSize: '2048',

    // Security
    enableSSL: true,
    forceSSL: true,
    enableCaptcha: true,
    captchaType: 'recaptcha',
    maxLoginAttempts: '5',
    passwordPolicy: 'strong',
    enableTwoFactor: false,
    ipBlacklist: [],
    
    // Logging
    enableErrorLogging: true,
    logRetention: '30',
    enableAuditLog: true,
    auditLogRetention: '90',
    logLevel: 'error',
    enableDebugMode: false,

    // Database
    enableBackups: true,
    backupSchedule: 'daily',
    backupRetention: '30',
    optimizeTables: true,
    tableOptimizationSchedule: 'weekly',

    // API
    enableAPI: false,
    apiRateLimit: '1000',
    apiTokenExpiry: '30',
    enableWebhooks: false,
    webhookEndpoints: [],

    // Development
    enableDevMode: false,
    showDebugBar: false,
    enableTestingTools: false,
    testingEmail: '',
    sandboxMode: false,

    // Maintenance
    enableMaintenance: false,
    maintenanceMessage: '',
    allowedIPs: [],
    scheduledMaintenance: false,
    maintenanceWindow: '',
  });

  const handleChange = (field: keyof AdvancedSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Performance */}
      <FormSection 
        title="Performance" 
        description="Configure performance optimization settings"
      >
        <FormRow
          label="Enable Caching"
          htmlFor="enableCaching"
          description="Enable system-wide caching"
        >
          <FormToggle
            id="enableCaching"
            checked={settings.enableCaching}
            onChange={(e) => handleChange('enableCaching', e.target.checked)}
          />
        </FormRow>

        {settings.enableCaching && (
          <FormRow
            label="Cache Lifetime"
            htmlFor="cacheLifetime"
            description="Cache lifetime in seconds"
          >
            <FormInput
              id="cacheLifetime"
              type="number"
              value={settings.cacheLifetime}
              onChange={(e) => handleChange('cacheLifetime', e.target.value)}
              min="0"
            />
          </FormRow>
        )}

        <FormRow
          label="Minify Assets"
          htmlFor="minifyAssets"
          description="Minify CSS, JavaScript, and HTML"
        >
          <FormToggle
            id="minifyAssets"
            checked={settings.minifyAssets}
            onChange={(e) => handleChange('minifyAssets', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Security */}
      <FormSection 
        title="Security" 
        description="Configure security settings"
      >
        <FormRow
          label="Enable SSL"
          htmlFor="enableSSL"
          description="Enable SSL/HTTPS"
        >
          <FormToggle
            id="enableSSL"
            checked={settings.enableSSL}
            onChange={(e) => handleChange('enableSSL', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable CAPTCHA"
          htmlFor="enableCaptcha"
          description="Enable CAPTCHA protection"
        >
          <FormToggle
            id="enableCaptcha"
            checked={settings.enableCaptcha}
            onChange={(e) => handleChange('enableCaptcha', e.target.checked)}
          />
        </FormRow>

        {settings.enableCaptcha && (
          <FormRow
            label="CAPTCHA Type"
            htmlFor="captchaType"
            description="Select CAPTCHA provider"
          >
            <FormSelect
              id="captchaType"
              value={settings.captchaType}
              onChange={(e) => handleChange('captchaType', e.target.value)}
              options={[
                { value: 'recaptcha', label: 'Google reCAPTCHA' },
                { value: 'hcaptcha', label: 'hCaptcha' },
              ]}
            />
          </FormRow>
        )}
      </FormSection>

      {/* Logging */}
      <FormSection 
        title="Logging" 
        description="Configure system logging"
      >
        <FormRow
          label="Error Logging"
          htmlFor="enableErrorLogging"
          description="Enable error logging"
        >
          <FormToggle
            id="enableErrorLogging"
            checked={settings.enableErrorLogging}
            onChange={(e) => handleChange('enableErrorLogging', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Log Level"
          htmlFor="logLevel"
          description="Select logging level"
        >
          <FormSelect
            id="logLevel"
            value={settings.logLevel}
            onChange={(e) => handleChange('logLevel', e.target.value)}
            options={[
              { value: 'error', label: 'Error' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
              { value: 'debug', label: 'Debug' },
            ]}
          />
        </FormRow>
      </FormSection>

      {/* Development */}
      <FormSection 
        title="Development" 
        description="Configure development settings"
      >
        <FormRow
          label="Developer Mode"
          htmlFor="enableDevMode"
          description="Enable developer mode"
        >
          <FormToggle
            id="enableDevMode"
            checked={settings.enableDevMode}
            onChange={(e) => handleChange('enableDevMode', e.target.checked)}
          />
        </FormRow>

        {settings.enableDevMode && (
          <>
            <FormRow
              label="Debug Bar"
              htmlFor="showDebugBar"
              description="Show debug bar"
            >
              <FormToggle
                id="showDebugBar"
                checked={settings.showDebugBar}
                onChange={(e) => handleChange('showDebugBar', e.target.checked)}
              />
            </FormRow>

            <FormRow
              label="Testing Tools"
              htmlFor="enableTestingTools"
              description="Enable testing tools"
            >
              <FormToggle
                id="enableTestingTools"
                checked={settings.enableTestingTools}
                onChange={(e) => handleChange('enableTestingTools', e.target.checked)}
              />
            </FormRow>
          </>
        )}
      </FormSection>

      {/* Maintenance */}
      <FormSection 
        title="Maintenance" 
        description="Configure maintenance settings"
      >
        <FormRow
          label="Maintenance Mode"
          htmlFor="enableMaintenance"
          description="Enable maintenance mode"
        >
          <FormToggle
            id="enableMaintenance"
            checked={settings.enableMaintenance}
            onChange={(e) => handleChange('enableMaintenance', e.target.checked)}
          />
        </FormRow>

        {settings.enableMaintenance && (
          <>
            <FormRow
              label="Maintenance Message"
              htmlFor="maintenanceMessage"
              description="Message to display during maintenance"
            >
              <FormTextarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                placeholder="Enter maintenance message..."
              />
            </FormRow>

            <FormRow
              label="Allowed IPs"
              htmlFor="allowedIPs"
              description="IPs allowed during maintenance (comma-separated)"
            >
              <FormInput
                id="allowedIPs"
                value={settings.allowedIPs.join(', ')}
                onChange={(e) => handleChange('allowedIPs', e.target.value.split(',').map(ip => ip.trim()))}
                placeholder="127.0.0.1, 192.168.1.1"
              />
            </FormRow>
          </>
        )}
      </FormSection>
    </div>
  );
} 