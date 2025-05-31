/**
 * Script to send test emails from the command line
 * 
 * This script sends a test email with the specified notification type.
 * It's useful for testing templates and email delivery.
 * 
 * Usage:
 *   ts-node src/scripts/send-test-email.ts [email] [type] [priority]
 * 
 * Examples:
 *   ts-node src/scripts/send-test-email.ts test@example.com ORDER_CONFIRMED high
 */

import { logger } from '../utils/logger';
import { initializeQueues } from '../services/queueService';
import { closeEmailQueue } from '../queues/emailQueue';
import { sendNotification } from '../services/notificationService';
import { NotificationEvents } from '../constants';
import { generateTestData } from '../utils/testDataGenerator';

// Get command line arguments
const [email = 'test@example.com', type = 'ORDER_CONFIRMED', priority = 'normal'] = process.argv.slice(2);
const notificationType = type.toUpperCase() as NotificationEvents;

// Verify notification type is valid
if (!Object.values(NotificationEvents).includes(notificationType)) {
  console.error(`Invalid notification type: ${type}`);
  console.error(`Valid types: ${Object.values(NotificationEvents).join(', ')}`);
  process.exit(1);
}

async function run() {
  try {
    logger.info(`Starting send-test-email to: ${email}`);
    
    // Initialize the queues
    await initializeQueues();
    logger.info('Queues initialized');
    
    // Generate test data for the notification type
    const testData = generateTestData(notificationType);
    
    // Send the notification
    const result = await sendNotification({
      type: notificationType,
      to: email,
      templateVars: testData,
      priority: priority as any,
      metadata: {
        isTest: true,
        source: 'command-line',
        timestamp: new Date().toISOString()
      },
      source: 'test-script'
    });
    
    if (!result.success) {
      logger.error('Failed to send test email', {
        errors: result.errors
      });
      return { success: false, errors: result.errors };
    }
    
    logger.info('Test email sent successfully', {
      to: email,
      type: notificationType,
      jobIds: result.jobIds,
      logIds: result.logIds
    });
    
    // Close queues before exiting
    await closeEmailQueue();
    
    return {
      success: true,
      jobIds: result.jobIds,
      logIds: result.logIds
    };
  } catch (error) {
    logger.error('Error sending test email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      email,
      type
    });
    
    // Try to close queues even if there was an error
    try {
      await closeEmailQueue();
    } catch (closeError) {
      logger.error('Error closing queues', {
        error: closeError instanceof Error ? closeError.message : 'Unknown error'
      });
    }
    
    return { success: false, error };
  }
}

// Run the script
if (require.main === module) {
  run()
    .then(result => {
      if (result.success) {
        console.log('Test email sent successfully!');
        console.log('Job IDs:', result.jobIds);
        console.log('Log IDs:', result.logIds);
        process.exit(0);
      } else {
        console.error('Failed to send test email:', result.errors || 'Unknown error');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error in script:', error);
      process.exit(1);
    });
}

export { run }; 