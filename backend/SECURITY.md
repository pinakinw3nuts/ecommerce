# 🔒 Security Guide

## **Overview**

This document outlines the security measures implemented in the E-commerce Backend API and provides guidelines for maintaining security in development and production environments.

## **🔐 Security Features**

### **1. Environment Variable Management**
- ✅ **No hardcoded secrets** in source code
- ✅ **Environment-specific configuration** (dev/staging/prod)
- ✅ **Required secret validation** in production
- ✅ **Secure fallbacks** for development

### **2. Authentication & Authorization**
- ✅ **JWT-based authentication** with secure tokens
- ✅ **Role-based access control** (ADMIN, USER, etc.)
- ✅ **Password hashing** with bcrypt (12 rounds)
- ✅ **Token refresh mechanism** with separate secrets
- ✅ **Secure session management**

### **3. Input Validation & Sanitization**
- ✅ **Zod schema validation** for all API inputs
- ✅ **Email format validation**
- ✅ **Password strength requirements**
- ✅ **SQL injection prevention** via TypeORM
- ✅ **XSS protection** via input sanitization

### **4. API Security**
- ✅ **Rate limiting** to prevent abuse
- ✅ **CORS configuration** for cross-origin requests
- ✅ **Helmet.js** for security headers
- ✅ **Request validation** and sanitization
- ✅ **Error handling** without information leakage

## **🚀 Quick Start**

### **1. Generate Secure Secrets**
```bash
# Generate JWT secrets only
npm run security:generate-jwt

# Generate all secrets
npm run security:generate
```

### **2. Set Up Environment Variables**
```bash
# Copy the example file
cp env.example .env

# Edit .env with your generated secrets
nano .env
```

### **3. Run Security Check**
```bash
# Check for security issues
npm run security:check

# Full security audit
npm run security:audit
```

## **📋 Environment Variables**

### **Required Variables**
```bash
# JWT Security (CRITICAL)
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secure-jwt-refresh-secret-key-minimum-32-characters

# Database
DB_PASSWORD=your-secure-database-password
```

### **Optional Variables**
```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

## **🔧 Security Scripts**

### **Available Commands**
```bash
# Security validation
npm run security:check          # Check for security issues
npm run security:audit          # Full security audit

# Secret generation
npm run security:generate       # Generate all secrets
npm run security:generate-jwt   # Generate JWT secrets only
```

### **Manual Secret Generation**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate database password
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## **🛡️ Security Best Practices**

### **1. Secret Management**
- ✅ **Never commit secrets** to version control
- ✅ **Use environment variables** for all sensitive data
- ✅ **Generate cryptographically secure** secrets
- ✅ **Rotate secrets regularly** (every 90 days)
- ✅ **Use different secrets** for each environment

### **2. Production Security**
- ✅ **Enable HTTPS** with valid SSL certificates
- ✅ **Use secrets management services** (AWS Secrets Manager, etc.)
- ✅ **Implement proper logging** without sensitive data
- ✅ **Enable security headers** (Helmet.js)
- ✅ **Regular security audits** and penetration testing

### **3. Development Security**
- ✅ **Use secure defaults** for development
- ✅ **Validate environment** on startup
- ✅ **Run security checks** regularly
- ✅ **Keep dependencies updated**
- ✅ **Use secure coding practices**

### **4. Database Security**
- ✅ **Use strong passwords** for database access
- ✅ **Limit database permissions** to minimum required
- ✅ **Enable SSL/TLS** for database connections
- ✅ **Regular database backups** with encryption
- ✅ **Monitor database access** and queries

### **5. API Security**
- ✅ **Implement rate limiting** to prevent abuse
- ✅ **Validate all inputs** with schemas
- ✅ **Use proper HTTP status codes**
- ✅ **Implement CORS** correctly
- ✅ **Monitor API usage** and errors

## **🚨 Security Checklist**

### **Before Deployment**
- [ ] All secrets are in environment variables
- [ ] No hardcoded secrets in source code
- [ ] JWT secrets are at least 32 characters
- [ ] Database password is strong
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Input validation is implemented
- [ ] Error handling doesn't leak information

### **Regular Maintenance**
- [ ] Rotate secrets every 90 days
- [ ] Update dependencies regularly
- [ ] Run security audits monthly
- [ ] Monitor logs for suspicious activity
- [ ] Review access controls quarterly
- [ ] Test backup and recovery procedures
- [ ] Update security documentation

## **🔍 Security Monitoring**

### **What to Monitor**
- **Failed authentication attempts**
- **Rate limit violations**
- **Unusual API usage patterns**
- **Database access patterns**
- **Error rates and types**
- **Performance metrics**

### **Alerting**
- Set up alerts for:
  - Multiple failed login attempts
  - Unusual traffic spikes
  - High error rates
  - Database connection issues
  - SSL certificate expiration

## **📚 Additional Resources**

### **Security Tools**
- **OWASP ZAP** - Web application security scanner
- **Snyk** - Dependency vulnerability scanner
- **npm audit** - Node.js security audit
- **Helmet.js** - Security headers middleware

### **Security Standards**
- **OWASP Top 10** - Web application security risks
- **NIST Cybersecurity Framework** - Security best practices
- **ISO 27001** - Information security management

### **Documentation**
- **Fastify Security** - https://www.fastify.io/docs/latest/Guides/Security/
- **Node.js Security** - https://nodejs.org/en/docs/guides/security/
- **JWT Security** - https://jwt.io/introduction

## **🆘 Security Incident Response**

### **If You Suspect a Breach**
1. **Immediate Actions**
   - Rotate all secrets immediately
   - Disable compromised accounts
   - Review access logs
   - Check for unauthorized changes

2. **Investigation**
   - Document the incident
   - Identify the root cause
   - Assess the impact
   - Implement fixes

3. **Recovery**
   - Restore from clean backups
   - Update security measures
   - Notify affected users
   - Update documentation

### **Contact Information**
- **Security Team**: security@yourcompany.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Bug Reports**: security-bugs@yourcompany.com

---

**Remember: Security is everyone's responsibility!** 🔒
