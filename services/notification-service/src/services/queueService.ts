import { Queue, Worker, QueueEvents } from 'bullmq';
import logger from '../utils/logger';
import { emailQueue, initializeEmailQueue, closeEmailQueue } from '../queues/emailQueue';
import { config } from '../config';

/**
 * Initialize all queues and their event listeners
 */
export async function initializeQueues(): Promise<void> {
  try {
    logger.info('Initializing notification queues...');
    
    // Initialize email queue
    await initializeEmailQueue();
    
    // Set up event listeners for the email queue if not in mock mode
    if (!(process.env.USE_MOCK_REDIS === 'true' && config.isDevelopment)) {
      setupQueueEventListeners(emailQueue as Queue, 'email');
    }
    
    logger.info('Notification queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queues:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Setup event listeners for a queue
 */
function setupQueueEventListeners(queue: Queue, queueName: string): void {
  try {
    // Skip in development mode with mock Redis
    if (process.env.USE_MOCK_REDIS === 'true' && config.isDevelopment) {
      logger.info(`Skipping queue event listeners setup for ${queueName} in mock mode`);
      return;
    }

    // Set up BullMQ QueueEvents for monitoring
    const queueEvents = new QueueEvents(queue.name, {
      connection: {
        host: new URL(config.redisUrl).hostname,
        port: parseInt(new URL(config.redisUrl).port || '6379'),
        password: new URL(config.redisUrl).password,
      }
    });

    // Queue event listeners
    queueEvents.on('completed', ({ jobId }) => {
      logger.debug(`${queueName} job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.warn(`${queueName} job ${jobId} failed: ${failedReason}`);
    });

    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`${queueName} job ${jobId} stalled`);
    });

    // Error event listener
    queueEvents.on('error', (error) => {
      logger.error(`${queueName} queue error:`, {
        error: error.message,
        stack: error.stack,
      });
    });

    logger.debug(`${queueName} queue event listeners set up`);
  } catch (error) {
    logger.warn(`Failed to set up queue event listeners for ${queueName}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Don't rethrow in development mode
    if (!config.isDevelopment) {
      throw error;
    }
  }
}

/**
 * Setup event listeners for a worker
 */
function setupWorkerEventListeners(worker: Worker, workerName: string): void {
  // Worker event listeners
  worker.on('completed', (job) => {
    logger.debug(`${workerName} worker completed job ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    const attemptsMade = job?.attemptsMade || 0;
    const maxAttempts = job?.opts.attempts || 0;
    
    logger.warn(`${workerName} worker failed job ${job?.id}`, {
      error: error.message,
      attemptsMade,
      maxAttempts,
    });

    // If this is the final attempt, log it differently
    if (attemptsMade >= maxAttempts) {
      logger.error(`${workerName} job ${job?.id} failed permanently after ${attemptsMade} attempts`, {
        error: error.message,
        jobData: job?.data,
      });
    }
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`${workerName} worker detected stalled job ${jobId}`);
  });

  worker.on('error', (error) => {
    logger.error(`${workerName} worker error:`, {
      error: error.message,
      stack: error.stack,
    });
  });

  logger.debug(`${workerName} worker event listeners set up`);
}

/**
 * Get active jobs count across all queues
 */
export async function getActiveJobCounts(): Promise<Record<string, number>> {
  try {
    const emailActiveCount = await emailQueue.getActiveCount();
    
    return {
      email: emailActiveCount,
      // Add other queues here as they are created
    };
  } catch (error) {
    logger.error('Failed to get active job counts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { email: 0 };
  }
}

/**
 * Get waiting jobs count across all queues
 */
export async function getWaitingJobCounts(): Promise<Record<string, number>> {
  try {
    const emailWaitingCount = await emailQueue.getWaitingCount();
    
    return {
      email: emailWaitingCount,
      // Add other queues here as they are created
    };
  } catch (error) {
    logger.error('Failed to get waiting job counts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { email: 0 };
  }
}

/**
 * Get delayed jobs count across all queues
 */
export async function getDelayedJobCounts(): Promise<Record<string, number>> {
  try {
    const emailDelayedCount = await emailQueue.getDelayedCount();
    
    return {
      email: emailDelayedCount,
      // Add other queues here as they are created
    };
  } catch (error) {
    logger.error('Failed to get delayed job counts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { email: 0 };
  }
}

/**
 * Get failed jobs count across all queues
 */
export async function getFailedJobCounts(): Promise<Record<string, number>> {
  try {
    const emailFailedCount = await emailQueue.getFailedCount();
    
    return {
      email: emailFailedCount,
      // Add other queues here as they are created
    };
  } catch (error) {
    logger.error('Failed to get failed job counts:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { email: 0 };
  }
}

/**
 * Get all queue metrics
 */
export async function getQueueMetrics(): Promise<{
  active: Record<string, number>;
  waiting: Record<string, number>;
  delayed: Record<string, number>;
  failed: Record<string, number>;
}> {
  return {
    active: await getActiveJobCounts(),
    waiting: await getWaitingJobCounts(),
    delayed: await getDelayedJobCounts(),
    failed: await getFailedJobCounts(),
  };
}

/**
 * Retry failed jobs for a specific queue
 */
export async function retryFailedJobs(queueName: 'email'): Promise<number> {
  try {
    let queue: Queue;
    
    // Get the appropriate queue
    switch (queueName) {
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
    
    // Get failed jobs
    const failedJobs = await queue.getFailed();
    
    // Retry each failed job
    for (const job of failedJobs) {
      await job.retry();
      logger.info(`Retried failed job ${job.id} in ${queueName} queue`);
    }
    
    return failedJobs.length;
  } catch (error) {
    logger.error(`Failed to retry failed jobs for ${queueName} queue:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Clean completed jobs from all queues
 */
export async function cleanCompletedJobs(): Promise<Record<string, number>> {
  try {
    const emailCleanedCount = await emailQueue.clean(24 * 60 * 60 * 1000, 1000, 'completed');
    
    return {
      email: emailCleanedCount.length,
      // Add other queues here as they are created
    };
  } catch (error) {
    logger.error('Failed to clean completed jobs:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { email: 0 };
  }
}

/**
 * Close all queues, workers, and schedulers
 */
export async function closeQueues(): Promise<void> {
  try {
    logger.info('Closing notification queues...');
    
    // Close email queue components
    await closeEmailQueue();
    
    // Add other queue closures here as they are created
    
    logger.info('All notification queues closed successfully');
  } catch (error) {
    logger.error('Failed to close queues:', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
} 