import { emailQueue, queueEmail, EmailJobData, closeEmailQueue } from './emailQueue';

// Export all queues
export {
  // Email queue
  emailQueue,
  queueEmail,
  EmailJobData,
  closeEmailQueue
};

/**
 * Initialize all queues
 */
export async function initializeQueues(): Promise<void> {
  // Future queue initialization can be added here
}

/**
 * Gracefully close all queues
 */
export async function closeQueues(): Promise<void> {
  await closeEmailQueue();
}
