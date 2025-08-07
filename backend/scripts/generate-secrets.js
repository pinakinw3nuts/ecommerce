#!/usr/bin/env node

/**
 * Secret Generation Utility
 * 
 * This script generates cryptographically secure secrets for:
 * - JWT tokens
 * - Database passwords
 * - API keys
 * - Other security-sensitive values
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --jwt-only
 *   node scripts/generate-secrets.js --length 128
 */

const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const jwtOnly = args.includes('--jwt-only');
const lengthArg = args.find(arg => arg.startsWith('--length='));
const length = lengthArg ? parseInt(lengthArg.split('=')[1]) : 64;

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateStrongPassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }
  return password;
}

function generateJWTSecret() {
  return generateSecret(64); // 512 bits for JWT
}

function generateDatabasePassword() {
  return generateStrongPassword(24);
}

console.log('🔐 SECURE SECRET GENERATOR');
console.log('==========================\n');

if (jwtOnly) {
  console.log('JWT Secrets:');
  console.log('------------');
  console.log(`JWT_SECRET=${generateJWTSecret()}`);
  console.log(`JWT_REFRESH_SECRET=${generateJWTSecret()}`);
} else {
  console.log('Generated Secrets:');
  console.log('------------------');
  console.log(`JWT_SECRET=${generateJWTSecret()}`);
  console.log(`JWT_REFRESH_SECRET=${generateJWTSecret()}`);
  console.log(`DB_PASSWORD=${generateDatabasePassword()}`);
  console.log(`API_KEY=${generateSecret(32)}`);
  console.log(`SESSION_SECRET=${generateSecret(32)}`);
  console.log(`ENCRYPTION_KEY=${generateSecret(32)}`);
}

console.log('\n📋 SECURITY RECOMMENDATIONS:');
console.log('============================');
console.log('1. Store these secrets in environment variables (.env file)');
console.log('2. NEVER commit .env files to version control');
console.log('3. Use different secrets for each environment (dev/staging/prod)');
console.log('4. Rotate secrets regularly (every 90 days)');
console.log('5. Use secrets management services in production');
console.log('6. Monitor for secret exposure in logs and error messages');
console.log('7. Use HTTPS in production');
console.log('8. Implement proper access controls');
console.log('9. Enable security headers');
console.log('10. Regular security audits');

console.log('\n🚨 IMPORTANT:');
console.log('=============');
console.log('- Copy these secrets to your .env file');
console.log('- Keep your .env file secure and never share it');
console.log('- Use different secrets for each deployment');
console.log('- Consider using a secrets management service for production');

console.log('\n✅ Generation complete!');
