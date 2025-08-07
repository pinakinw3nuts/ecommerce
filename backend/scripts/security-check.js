#!/usr/bin/env node

/**
 * Security Validation Script
 * 
 * This script checks for common security issues:
 * - Hardcoded secrets
 * - Weak passwords
 * - Missing environment variables
 * - Insecure configurations
 * 
 * Usage:
 *   node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');

// Security patterns to check for
const SECURITY_PATTERNS = {
  hardcodedSecrets: [
    /['"]your-jwt-secret-key['"]/gi,
    /['"]your-jwt-refresh-secret-key['"]/gi,
    /['"]postgres123['"]/gi,
    /['"]your-app-password['"]/gi,
    /['"]your-email@gmail\.com['"]/gi,
    /['"]sk_test_\.\.\.['"]/gi,
    /['"]whsec_\.\.\.['"]/gi,
  ],
  weakPasswords: [
    /password\s*[:=]\s*['"]123['"]/gi,
    /password\s*[:=]\s*['"]password['"]/gi,
    /password\s*[:=]\s*['"]admin['"]/gi,
    /password\s*[:=]\s*['"]root['"]/gi,
  ],
  insecureConfigs: [
    /NODE_ENV\s*[:=]\s*['"]production['"].*JWT_SECRET\s*[:=]\s*['"]dev-/gi,
    /CORS_ORIGINS\s*[:=]\s*['"]\*['"]/gi,
  ]
};

// Files to check
const FILES_TO_CHECK = [
  'src/config/env.ts',
  'src/routes/auth.ts',
  'src/middleware/auth.ts',
  'src/services/user.service.ts',
  'package.json',
  'jest.config.js'
];

function checkFile(filePath) {
  const issues = [];
  
  if (!fs.existsSync(filePath)) {
    return issues;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for hardcoded secrets
  SECURITY_PATTERNS.hardcodedSecrets.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'HARDCODED_SECRET',
        severity: 'CRITICAL',
        message: `Found hardcoded secret in ${filePath}`,
        line: content.split('\n').findIndex(line => pattern.test(line)) + 1,
        pattern: pattern.toString()
      });
    }
  });
  
  // Check for weak passwords
  SECURITY_PATTERNS.weakPasswords.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'WEAK_PASSWORD',
        severity: 'HIGH',
        message: `Found weak password in ${filePath}`,
        line: content.split('\n').findIndex(line => pattern.test(line)) + 1,
        pattern: pattern.toString()
      });
    }
  });
  
  // Check for insecure configurations
  SECURITY_PATTERNS.insecureConfigs.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'INSECURE_CONFIG',
        severity: 'MEDIUM',
        message: `Found insecure configuration in ${filePath}`,
        line: content.split('\n').findIndex(line => pattern.test(line)) + 1,
        pattern: pattern.toString()
      });
    }
  });
  
  return issues;
}

function checkEnvironmentVariables() {
  const issues = [];
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_PASSWORD'
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push({
        type: 'MISSING_ENV_VAR',
        severity: 'HIGH',
        message: `Missing required environment variable: ${varName}`,
        recommendation: `Set ${varName} in your .env file`
      });
    }
  });
  
  // Check for weak JWT secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    issues.push({
      type: 'WEAK_JWT_SECRET',
      severity: 'CRITICAL',
      message: 'JWT_SECRET is too short (minimum 32 characters)',
      recommendation: 'Generate a longer, cryptographically secure secret'
    });
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    issues.push({
      type: 'WEAK_JWT_SECRET',
      severity: 'CRITICAL',
      message: 'JWT_REFRESH_SECRET is too short (minimum 32 characters)',
      recommendation: 'Generate a longer, cryptographically secure secret'
    });
  }
  
  return issues;
}

function main() {
  console.log('🔒 SECURITY VALIDATION CHECK');
  console.log('============================\n');
  
  let allIssues = [];
  
  // Check files
  console.log('📁 Checking files for security issues...');
  FILES_TO_CHECK.forEach(filePath => {
    const issues = checkFile(filePath);
    allIssues = allIssues.concat(issues);
  });
  
  // Check environment variables
  console.log('🌍 Checking environment variables...');
  const envIssues = checkEnvironmentVariables();
  allIssues = allIssues.concat(envIssues);
  
  // Report results
  console.log('\n📊 SECURITY CHECK RESULTS');
  console.log('=========================');
  
  if (allIssues.length === 0) {
    console.log('✅ No security issues found!');
    console.log('🎉 Your configuration appears to be secure.');
  } else {
    console.log(`❌ Found ${allIssues.length} security issue(s):\n`);
    
    const criticalIssues = allIssues.filter(issue => issue.severity === 'CRITICAL');
    const highIssues = allIssues.filter(issue => issue.severity === 'HIGH');
    const mediumIssues = allIssues.filter(issue => issue.severity === 'MEDIUM');
    
    if (criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES:');
      criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
        if (issue.recommendation) console.log(`     Fix: ${issue.recommendation}`);
        console.log('');
      });
    }
    
    if (highIssues.length > 0) {
      console.log('⚠️  HIGH PRIORITY ISSUES:');
      highIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
        if (issue.recommendation) console.log(`     Fix: ${issue.recommendation}`);
        console.log('');
      });
    }
    
    if (mediumIssues.length > 0) {
      console.log('⚠️  MEDIUM PRIORITY ISSUES:');
      mediumIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`);
        if (issue.line) console.log(`     Line: ${issue.line}`);
        if (issue.recommendation) console.log(`     Fix: ${issue.recommendation}`);
        console.log('');
      });
    }
    
    console.log('🔧 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. Run: node scripts/generate-secrets.js');
    console.log('2. Update your .env file with secure values');
    console.log('3. Remove any hardcoded secrets from source code');
    console.log('4. Use environment variables for all sensitive data');
    console.log('5. Enable HTTPS in production');
    console.log('6. Implement proper access controls');
    console.log('7. Regular security audits');
  }
  
  console.log('\n✅ Security check complete!');
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, checkEnvironmentVariables };
