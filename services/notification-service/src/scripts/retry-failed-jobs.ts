/**
 * Script to manually retry failed notification jobs
 * 
 * This script connects to the notification queue and retries all failed jobs.
 * It can be used for recovery or debugging purposes.
 * 
 * Usage:
 *   ts-node src/scripts/retry-failed-jobs.ts [queue] [limit]
 * 
 * Examples:
 *   ts-node src/scripts/retry-failed-jobs.ts email 50
 */

import { logger } from '../utils/logger';
import { config } from '../config';
import { initializeQueues, retryFailedJobs } from '../services/queueService';
import { closeEmailQueue } from '../queues/emailQueue';

// Get command line arguments
const [queueName = 'email', limitStr = '50'] = process.argv.slice(2);
const limit = parseInt(limitStr, 10);

async function run() {
  try {
    logger.info(`Starting retry-failed-jobs for queue: ${queueName}`);
    
    // Initialize the queues
    await initializeQueues();
    logger.info('Queues initialized');
    
    // Retry the failed jobs
    const retriedCount = await retryFailedJobs(queueName as 'email');
    
    logger.info(`Retried ${retriedCount} failed ${queueName} jobs`);
    
    // If no jobs were retried, it might indicate that there are no failed jobs
    if (retriedCount === 0) {
      logger.info(`No failed jobs found in ${queueName} queue`);
    }
    
    // Close queues before exiting
    await closeEmailQueue();
    
    return retriedCount;
  } catch (error) {
    logger.error('Error retrying failed jobs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      queue: queueName
    });
    
    // Try to close queues even if there was an error
    try {
      await closeEmailQueue();
    } catch (closeError) {
      logger.error('Error closing queues', {
        error: closeError instanceof Error ? closeError.message : 'Unknown error'
      });
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  run()
    .then(retriedCount => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Fatal error in script', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    });
}

export { run }; 