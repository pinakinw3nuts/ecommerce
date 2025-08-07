export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
  html: string;
  description?: string;
  category?: string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  // Order confirmation template
  'order-confirmed': {
    id: 'order-confirmed',
    name: 'Order Confirmation',
    subject: 'Your order #{{orderNumber}} has been confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Dear {{name}},</p>
        <p>Thank you for your order. Your order #{{orderNumber}} has been confirmed and is being processed.</p>
        
        <h2 style="color: #555;">Order Details</h2>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Order Total:</strong> {{currency}}{{orderTotal}}</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Items</h3>
          <ul style="list-style: none; padding: 0;">
            {{#each items}}
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;">{{name}} x {{quantity}} - {{currency}}{{price}}</li>
            {{/each}}
          </ul>
        </div>
        
        <p>You can view your order status by <a href="{{orderUrl}}" style="color: #007bff;">clicking here</a>.</p>
        <p>Thank you for shopping with us!</p>
      </div>
    `,
    text: `
      Order Confirmation
      
      Dear {{name}},
      
      Thank you for your order. Your order #{{orderNumber}} has been confirmed and is being processed.
      
      Order Details
      Order Date: {{orderDate}}
      Order Total: {{currency}}{{orderTotal}}
      
      Items:
      {{#each items}}
      - {{name}} x {{quantity}} - {{currency}}{{price}}
      {{/each}}
      
      You can view your order status at: {{orderUrl}}
      
      Thank you for shopping with us!
    `,
    description: 'Email sent to customers when their order is confirmed',
    category: 'orders'
  },
  
  // Shipping update template
  'shipping-update': {
    id: 'shipping-update',
    name: 'Shipping Update',
    subject: 'Shipping update for your order #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Shipping Update</h1>
        <p>Dear {{name}},</p>
        <p>We have an update about your order #{{orderNumber}}.</p>
        <p>Your order is now <strong style="color: #28a745;">{{status}}</strong>.</p>
        
        {{#if trackingNumber}}
        <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        {{/if}}
        
        {{#if trackingUrl}}
        <p>Track your package: <a href="{{trackingUrl}}" style="color: #007bff;">{{trackingUrl}}</a></p>
        {{/if}}
        
        {{#if estimatedDelivery}}
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        {{/if}}
        
        <p>Thank you for your patience!</p>
      </div>
    `,
    text: `
      Shipping Update
      
      Dear {{name}},
      
      We have an update about your order #{{orderNumber}}.
      
      Your order is now {{status}}.
      
      {{#if trackingNumber}}
      Tracking Number: {{trackingNumber}}
      {{/if}}
      
      {{#if trackingUrl}}
      Track your package: {{trackingUrl}}
      {{/if}}
      
      {{#if estimatedDelivery}}
      Estimated Delivery: {{estimatedDelivery}}
      {{/if}}
      
      Thank you for your patience!
    `,
    description: 'Email sent to customers when their order shipping status changes',
    category: 'orders'
  },
  
  // Payment successful template
  'payment-successful': {
    id: 'payment-successful',
    name: 'Payment Successful',
    subject: 'Payment received for order #{{orderNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Payment Successful</h1>
        <p>Dear {{name}},</p>
        <p>We have successfully received your payment for order #{{orderNumber}}.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Amount:</strong> {{currency}}{{amount}}</p>
          <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        </div>
        
        <p>Your order is now being processed and will be shipped soon.</p>
        <p>Thank you for your purchase!</p>
      </div>
    `,
    text: `
      Payment Successful
      
      Dear {{name}},
      
      We have successfully received your payment for order #{{orderNumber}}.
      
      Payment Details
      Amount: {{currency}}{{amount}}
      Payment Method: {{paymentMethod}}
      Transaction ID: {{transactionId}}
      
      Your order is now being processed and will be shipped soon.
      
      Thank you for your purchase!
    `,
    description: 'Email sent to customers when payment is successful',
    category: 'payments'
  },
  
  // Password reset template
  'password-reset': {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Dear {{name}},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        
        <p>This link will expire in {{expiryTime}}.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Thank you!</p>
      </div>
    `,
    text: `
      Reset Your Password
      
      Dear {{name}},
      
      We received a request to reset your password. Click the link below to create a new password:
      
      {{resetUrl}}
      
      This link will expire in {{expiryTime}}.
      
      If you didn't request this password reset, please ignore this email.
      
      Thank you!
    `,
    description: 'Email sent to users when they request a password reset',
    category: 'account'
  },
  
  // Account verification template
  'account-verification': {
    id: 'account-verification',
    name: 'Account Verification',
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify Your Email Address</h1>
        <p>Dear {{name}},</p>
        <p>Welcome to our platform! Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        
        <p>This link will expire in {{expiryTime}}.</p>
        <p>Thank you for joining us!</p>
      </div>
    `,
    text: `
      Verify Your Email Address
      
      Dear {{name}},
      
      Welcome to our platform! Please verify your email address by clicking the link below:
      
      {{verificationUrl}}
      
      This link will expire in {{expiryTime}}.
      
      Thank you for joining us!
    `,
    description: 'Email sent to new users to verify their email address',
    category: 'account'
  },
  
  // Abandoned cart template
  'abandoned-cart': {
    id: 'abandoned-cart',
    name: 'Abandoned Cart',
    subject: 'Complete your purchase - items waiting in your cart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Complete Your Purchase</h1>
        <p>Dear {{name}},</p>
        <p>We noticed you have items waiting in your cart. Don't miss out on these great products!</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Items in Your Cart</h3>
          <ul style="list-style: none; padding: 0;">
            {{#each items}}
            <li style="padding: 5px 0; border-bottom: 1px solid #eee;">{{name}} - {{currency}}{{price}}</li>
            {{/each}}
          </ul>
          <p style="font-weight: bold; margin-top: 15px;">Total: {{currency}}{{total}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{cartUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Purchase</a>
        </div>
        
        <p>Hurry! These items may not be available for long.</p>
      </div>
    `,
    text: `
      Complete Your Purchase
      
      Dear {{name}},
      
      We noticed you have items waiting in your cart. Don't miss out on these great products!
      
      Items in Your Cart:
      {{#each items}}
      - {{name}} - {{currency}}{{price}}
      {{/each}}
      
      Total: {{currency}}{{total}}
      
      Complete your purchase at: {{cartUrl}}
      
      Hurry! These items may not be available for long.
    `,
    description: 'Email sent to customers who abandoned their cart',
    category: 'marketing'
  },
  
  // Back in stock template
  'back-in-stock': {
    id: 'back-in-stock',
    name: 'Back in Stock',
    subject: '{{productName}} is back in stock!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Back in Stock!</h1>
        <p>Dear {{name}},</p>
        <p>Great news! <strong>{{productName}}</strong> is back in stock and ready for purchase.</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Product Details</h3>
          <p><strong>Price:</strong> {{currency}}{{price}}</p>
          {{#if originalPrice}}
          <p><strong>Original Price:</strong> <span style="text-decoration: line-through;">{{currency}}{{originalPrice}}</span></p>
          {{/if}}
          <p><strong>Availability:</strong> {{stockLevel}} units available</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{productUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Buy Now</a>
        </div>
        
        <p>Don't miss out - this item may sell out quickly!</p>
      </div>
    `,
    text: `
      Back in Stock!
      
      Dear {{name}},
      
      Great news! {{productName}} is back in stock and ready for purchase.
      
      Product Details
      Price: {{currency}}{{price}}
      {{#if originalPrice}}
      Original Price: {{currency}}{{originalPrice}}
      {{/if}}
      Availability: {{stockLevel}} units available
      
      Buy now at: {{productUrl}}
      
      Don't miss out - this item may sell out quickly!
    `,
    description: 'Email sent to customers when a product they are interested in comes back in stock',
    category: 'marketing'
  }
};

/**
 * Get template by ID
 */
export function getTemplate(id: string): EmailTemplate | undefined {
  return emailTemplates[id];
}

/**
 * Get all templates
 */
export function getAllTemplates(): EmailTemplate[] {
  return Object.values(emailTemplates);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return getAllTemplates().filter(template => template.category === category);
}

/**
 * Interpolate template with data
 */
export function interpolateTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Replace simple variables {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
  
  // Handle arrays with {{#each items}}...{{/each}}
  result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, template) => {
    const array = data[arrayKey];
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      let itemTemplate = template;
      // Replace item variables
      itemTemplate = itemTemplate.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
        return item[key] !== undefined ? String(item[key]) : match;
      });
      return itemTemplate;
    }).join('');
  });
  
  // Handle conditional blocks {{#if condition}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, template) => {
    return data[condition] ? template : '';
  });
  
  return result;
} 