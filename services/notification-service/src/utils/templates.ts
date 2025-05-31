/**
 * Notification Templates
 * 
 * This file contains template functions for common notification types.
 * Each template is a function that takes context data and returns formatted content.
 */

/**
 * Template context for order confirmation
 */
export interface OrderConfirmationContext {
  orderId: string;
  customerName: string;
  orderDate: string | Date;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingMethod: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  estimatedDelivery?: string;
  orderUrl: string;
}

/**
 * Template context for password reset
 */
export interface PasswordResetContext {
  userName: string;
  resetLink: string;
  expiryTime: string | number;
  requestIp?: string;
  requestTime?: string | Date;
}

/**
 * Template context for admin alert
 */
export interface AdminAlertContext {
  alertType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string | Date;
  details?: Record<string, unknown>;
  actionUrl?: string;
}

/**
 * Template context for welcome email
 */
export interface WelcomeEmailContext {
  userName: string;
  verificationLink?: string;
  accountUrl: string;
  supportEmail: string;
}

/**
 * Template context for shipping update
 */
export interface ShippingUpdateContext {
  orderId: string;
  customerName: string;
  orderDate: string | Date;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  status: 'shipped' | 'out_for_delivery' | 'delivered' | 'delayed';
  statusDescription: string;
  estimatedDelivery?: string;
  orderUrl: string;
}

/**
 * Order confirmation email template
 */
export function orderConfirmationTemplate(context: OrderConfirmationContext): { subject: string; html: string; text: string } {
  const { customerName, orderId, orderDate, orderItems, total, orderUrl } = context;
  
  // Format date
  const formattedDate = typeof orderDate === 'string' 
    ? orderDate 
    : orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Format currency
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  
  // Generate order items HTML
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('');
  
  // Create plain text version
  const text = `
    Order Confirmation - Order #${orderId}
    
    Hello ${customerName},
    
    Thank you for your order! We've received your order and are getting it ready to ship.
    
    Order Details:
    Order #: ${orderId}
    Order Date: ${formattedDate}
    
    ${orderItems.map(item => `${item.name} (${item.quantity}) - ${formatCurrency(item.subtotal)}`).join('\n')}
    
    Subtotal: ${formatCurrency(context.subtotal)}
    Shipping: ${formatCurrency(context.shipping)}
    Tax: ${formatCurrency(context.tax)}
    Total: ${formatCurrency(total)}
    
    Your order will be shipped to:
    ${context.shippingAddress.line1}
    ${context.shippingAddress.line2 ? context.shippingAddress.line2 + '\n' : ''}${context.shippingAddress.city}, ${context.shippingAddress.state} ${context.shippingAddress.postalCode}
    ${context.shippingAddress.country}
    
    Shipping Method: ${context.shippingMethod}
    ${context.estimatedDelivery ? `Estimated Delivery: ${context.estimatedDelivery}` : ''}
    
    You can view your order status at: ${orderUrl}
    
    Thank you for shopping with us!
  `.trim();
  
  // Create HTML version
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Order #${orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px 0; border-bottom: 2px solid #ddd; }
        .order-summary { background-color: #f8f9fa; padding: 15px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Confirmation</h1>
        <p>Order #${orderId}</p>
      </div>
      <div class="content">
        <p>Hello ${customerName},</p>
        <p>Thank you for your order! We've received your order and are getting it ready to ship.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order Date:</strong> ${formattedDate}</p>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="order-summary">
          <p><strong>Subtotal:</strong> <span style="float: right;">${formatCurrency(context.subtotal)}</span></p>
          <p><strong>Shipping:</strong> <span style="float: right;">${formatCurrency(context.shipping)}</span></p>
          <p><strong>Tax:</strong> <span style="float: right;">${formatCurrency(context.tax)}</span></p>
          <p style="font-size: 18px;"><strong>Total:</strong> <span style="float: right;">${formatCurrency(total)}</span></p>
        </div>
        
        <h2>Shipping Information</h2>
        <p>
          ${context.shippingAddress.line1}<br>
          ${context.shippingAddress.line2 ? context.shippingAddress.line2 + '<br>' : ''}
          ${context.shippingAddress.city}, ${context.shippingAddress.state} ${context.shippingAddress.postalCode}<br>
          ${context.shippingAddress.country}
        </p>
        
        <p><strong>Shipping Method:</strong> ${context.shippingMethod}</p>
        ${context.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${context.estimatedDelivery}</p>` : ''}
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="${orderUrl}" class="button">View Order Status</a>
        </p>
      </div>
      <div class="footer">
        <p>Thank you for shopping with us!</p>
        <p>If you have any questions, please contact our customer service.</p>
      </div>
    </body>
    </html>
  `.trim();
  
  return {
    subject: `Order Confirmation - Order #${orderId}`,
    html,
    text
  };
}

/**
 * Password reset email template
 */
export function passwordResetTemplate(context: PasswordResetContext): { subject: string; html: string; text: string } {
  const { userName, resetLink, expiryTime } = context;
  
  const text = `
    Password Reset Request
    
    Hello ${userName},
    
    We received a request to reset your password. To reset your password, please click on the link below:
    
    ${resetLink}
    
    This link will expire in ${expiryTime}.
    
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    Thank you,
    The Team
  `.trim();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .note { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. To reset your password, please click on the button below:</p>
        
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        
        <p>Alternatively, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
          ${resetLink}
        </p>
        
        <p>This link will expire in <strong>${expiryTime}</strong>.</p>
        
        <div class="note">
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      </div>
      <div class="footer">
        <p>Thank you,</p>
        <p>The Team</p>
      </div>
    </body>
    </html>
  `.trim();
  
  return {
    subject: 'Password Reset Request',
    html,
    text
  };
}

/**
 * Admin alert email template
 */
export function adminAlertTemplate(context: AdminAlertContext): { subject: string; html: string; text: string } {
  const { alertType, severity, message, timestamp, details, actionUrl } = context;
  
  // Format timestamp
  const formattedTime = typeof timestamp === 'string' 
    ? timestamp 
    : timestamp.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
  
  // Create severity color
  const severityColor = {
    critical: '#dc3545',
    high: '#fd7e14',
    medium: '#ffc107',
    low: '#17a2b8'
  }[severity];
  
  // Format details as text
  const detailsText = details 
    ? Object.entries(details).map(([key, value]) => `${key}: ${value}`).join('\n')
    : '';
  
  const text = `
    ADMIN ALERT: ${alertType.toUpperCase()} - ${severity.toUpperCase()}
    
    Message: ${message}
    Timestamp: ${formattedTime}
    Severity: ${severity.toUpperCase()}
    
    ${detailsText ? `Details:\n${detailsText}\n\n` : ''}
    ${actionUrl ? `Action URL: ${actionUrl}` : ''}
  `.trim();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Alert: ${alertType}</title>
      <style>
        body { font-family: monospace; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
        .header { background-color: ${severityColor}; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; }
        .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .severity { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; color: white; background-color: ${severityColor}; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ADMIN ALERT: ${alertType.toUpperCase()}</h1>
      </div>
      <div class="content">
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Timestamp:</strong> ${formattedTime}</p>
        <p><strong>Severity:</strong> <span class="severity">${severity.toUpperCase()}</span></p>
        
        ${details ? `
        <h2>Details:</h2>
        <div class="details">
          <pre>${JSON.stringify(details, null, 2)}</pre>
        </div>
        ` : ''}
        
        ${actionUrl ? `
        <p style="text-align: center; margin-top: 30px;">
          <a href="${actionUrl}" class="button">Take Action</a>
        </p>
        ` : ''}
      </div>
      <div class="footer">
        <p>This is an automated alert. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `.trim();
  
  return {
    subject: `ADMIN ALERT: ${alertType.toUpperCase()} - ${severity.toUpperCase()}`,
    html,
    text
  };
}

/**
 * Welcome email template
 */
export function welcomeTemplate(context: WelcomeEmailContext): { subject: string; html: string; text: string } {
  const { userName, verificationLink, accountUrl, supportEmail } = context;
  
  const text = `
    Welcome to Our Platform!
    
    Hello ${userName},
    
    Thank you for joining our platform! We're excited to have you on board.
    
    ${verificationLink ? `To verify your email address and activate your account, please click the link below:
    ${verificationLink}
    
    ` : ''}You can access your account at any time by visiting:
    ${accountUrl}
    
    If you have any questions, feel free to contact our support team at ${supportEmail}.
    
    Best regards,
    The Team
  `.trim();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Platform!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #4CAF50; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Our Platform!</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <p>Thank you for joining our platform! We're excited to have you on board.</p>
        
        ${verificationLink ? `
        <p>To verify your email address and activate your account, please click the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </p>
        ` : ''}
        
        <p>You can access your account at any time by visiting our platform:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${accountUrl}" class="button">Access Your Account</a>
        </p>
        
        <p>If you have any questions, feel free to contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      </div>
      <div class="footer">
        <p>Best regards,</p>
        <p>The Team</p>
      </div>
    </body>
    </html>
  `.trim();
  
  return {
    subject: 'Welcome to Our Platform!',
    html,
    text
  };
}

/**
 * Shipping update email template
 */
export function shippingUpdateTemplate(context: ShippingUpdateContext): { subject: string; html: string; text: string } {
  const { customerName, orderId, status, statusDescription, trackingNumber, trackingUrl, orderUrl } = context;
  
  // Map status to more readable title
  const statusTitles = {
    shipped: 'Your Order Has Shipped',
    out_for_delivery: 'Your Order Is Out For Delivery',
    delivered: 'Your Order Has Been Delivered',
    delayed: 'Your Order Has Been Delayed'
  };
  
  // Status colors
  const statusColors = {
    shipped: '#007bff',
    out_for_delivery: '#17a2b8',
    delivered: '#28a745',
    delayed: '#dc3545'
  };
  
  const title = statusTitles[status];
  const color = statusColors[status];
  
  const text = `
    ${title} - Order #${orderId}
    
    Hello ${customerName},
    
    ${statusDescription}
    
    ${trackingNumber ? `Tracking Number: ${trackingNumber}
    ${trackingUrl ? `Track your package: ${trackingUrl}` : ''}
    
    ` : ''}You can view your order details at: ${orderUrl}
    
    Thank you for shopping with us!
  `.trim();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Order #${orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: ${color}; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: ${color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .tracking-box { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Order #${orderId}</p>
      </div>
      <div class="content">
        <p>Hello ${customerName},</p>
        <p>${statusDescription}</p>
        
        ${trackingNumber ? `
        <div class="tracking-box">
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          ${trackingUrl ? `
          <p style="text-align: center;">
            <a href="${trackingUrl}" class="button">Track Your Package</a>
          </p>
          ` : ''}
        </div>
        ` : ''}
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="${orderUrl}" class="button">View Order Details</a>
        </p>
      </div>
      <div class="footer">
        <p>Thank you for shopping with us!</p>
        <p>If you have any questions, please contact our customer service.</p>
      </div>
    </body>
    </html>
  `.trim();
  
  return {
    subject: `${title} - Order #${orderId}`,
    html,
    text
  };
} 