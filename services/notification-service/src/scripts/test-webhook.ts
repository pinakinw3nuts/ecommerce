/**
 * Test script for simulating email provider webhook callbacks
 * 
 * This script can be used to test the webhook endpoint by simulating 
 * delivery status callbacks from various email providers.
 * 
 * Usage: 
 *   ts-node src/scripts/test-webhook.ts [event] [logId] [provider]
 * 
 * Examples:
 *   ts-node src/scripts/test-webhook.ts delivered abc123 sendgrid
 *   ts-node src/scripts/test-webhook.ts bounced abc123 mailgun
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Default values
const DEFAULT_EVENT = 'delivered';
const DEFAULT_PROVIDER = 'sendgrid';
const DEFAULT_RECIPIENT = 'test@example.com';
const DEFAULT_MESSAGE_ID = `mock-${uuidv4()}`;

// Get command line arguments
const [event = DEFAULT_EVENT, logId, provider = DEFAULT_PROVIDER] = process.argv.slice(2);
const baseUrl = process.env.SERVICE_URL || 'http://localhost:3014';

// Create a webhook payload based on the provider
function createWebhookPayload(provider: string, event: string, logId?: string): any {
  const messageId = DEFAULT_MESSAGE_ID;
  const recipient = DEFAULT_RECIPIENT;
  const timestamp = Math.floor(Date.now() / 1000);
  
  switch (provider.toLowerCase()) {
    case 'sendgrid':
      return {
        sg_message_id: messageId,
        email: recipient,
        timestamp,
        event,
        category: ['test'],
        provider: 'sendgrid',
        metadata: logId ? { logId } : undefined
      };
      
    case 'mailgun':
      return {
        signature: {
          token: 'test-token',
          timestamp: String(timestamp),
          signature: 'test-signature'
        },
        'event-data': {
          event,
          timestamp,
          id: messageId,
          message: {
            headers: {
              subject: 'Test Email'
            },
            recipients: [recipient]
          },
          recipient
        },
        provider: 'mailgun',
        metadata: logId ? { logId } : undefined
      };
      
    case 'ses':
      return {
        Type: 'Notification',
        Message: JSON.stringify({
          eventType: event,
          mail: {
            messageId,
            destination: [recipient],
            timestamp: new Date().toISOString()
          },
          metadata: logId ? { logId } : undefined
        }),
        MessageId: uuidv4(),
        Timestamp: new Date().toISOString(),
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:ses-notifications',
        provider: 'ses'
      };
      
    default:
      // Generic webhook format
      return {
        event,
        messageId,
        timestamp: new Date().toISOString(),
        recipient,
        status: event,
        provider: provider || 'generic',
        metadata: logId ? { logId } : undefined
      };
  }
}

// Send the webhook request
async function sendWebhook() {
  const payload = createWebhookPayload(provider, event, logId);
  const webhookEndpoint = provider === 'generic' 
    ? `${baseUrl}/api/webhooks/email-status`
    : `${baseUrl}/api/webhooks/${provider}`;
  
  console.log(`Sending ${event} webhook to ${webhookEndpoint}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(webhookEndpoint, payload);
    console.log('Response:', response.status, response.data);
  } catch (error) {
    console.error('Error sending webhook:');
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error('Response data:', error.response?.data);
    } else {
      console.error(error);
    }
  }
}

// Run the script
sendWebhook().catch(console.error); 