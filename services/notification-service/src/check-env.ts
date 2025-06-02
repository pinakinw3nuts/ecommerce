import { config } from './config';

// Display all environment configuration values
console.log('=== Environment Configuration ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Port:', config.port);
console.log('Environment:', config.environment);
console.log('isDevelopment:', config.isDevelopment);
console.log('isTest:', config.isTest);
console.log('isProduction:', config.isProduction);
console.log('Redis URL:', config.redisUrl);
console.log('Use Mock Redis:', config.useMockRedis);
console.log('JWT Secret:', config.jwtSecret ? '***' + config.jwtSecret.substr(-4) : 'undefined');
console.log('Service Tokens Count:', config.serviceTokens?.length || 0);
console.log('Email From:', config.emailFrom);
console.log('Notify Mode:', config.notifyMode);
console.log('CORS Origins:', typeof config.corsOrigins === 'string' ? config.corsOrigins : JSON.stringify(config.corsOrigins));

// Check for potential issues
console.log('\n=== Potential Issues ===');

// Check port number
if (config.port < 1024 && process.platform !== 'win32') {
  console.log('❌ Port is below 1024 which may require elevated privileges on non-Windows systems');
} else {
  console.log('✅ Port number looks valid');
}

// Check JWT secret
if (config.jwtSecret.length < 16) {
  console.log('❌ JWT secret is too short (should be at least 16 characters)');
} else {
  console.log('✅ JWT secret length is adequate');
}

// Check Redis URL
if (config.useMockRedis) {
  console.log('ℹ️ Using mock Redis - this is fine for development');
} else if (!config.redisUrl.startsWith('redis://')) {
  console.log('❌ Redis URL does not appear to be valid');
} else {
  console.log('✅ Redis URL format looks valid');
}

// Check email configuration
if (config.notifyMode === 'email' && !config.email?.smtp && !config.email?.sendgrid && !config.email?.mailgun) {
  console.log('❌ Email notification mode is set but no email transport is configured');
} else if (config.notifyMode === 'log') {
  console.log('ℹ️ Notify mode is set to log - no actual emails will be sent');
} else {
  console.log('✅ Notification configuration appears valid');
}

console.log('\n=== Node.js Process Information ===');
console.log('Process ID:', process.pid);
console.log('User ID:', process.getuid?.() || 'N/A');
console.log('Group ID:', process.getgid?.() || 'N/A');
console.log('Current working directory:', process.cwd());
console.log('Node.js executable path:', process.execPath);

// Exit normally
process.exit(0); 