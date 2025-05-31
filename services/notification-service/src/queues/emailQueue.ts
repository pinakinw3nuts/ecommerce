import { Queue, QueueOptions, Job, JobsOptions } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { redisConnection } from '../utils/redis';
import { config } from '../config';
import { 
  logNotificationSending,
  logNotificationSent,
  logNotificationFailed
} from '../services/notificationHistoryService';
import { NotificationStatus } from '../models/NotificationLog';

/**
 * Email job data structure
 */
export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  attachments?: any[];
  priority?: 'high' | 'normal' | 'low';
  scheduledTime?: Date;
  source?: string;
  templateId?: string;
  metadata?: {
    notificationType?: string;
    userId?: string;
    orderId?: string;
    templateId?: string;
    [key: string]: any;
  };
}

/**
 * Constants for queue configuration
 */
const QUEUE_NAME = 'email-queue';

/**
 * Queue configuration
 */
const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000 // 1 second, then 2, then 4, etc.
    },
    removeOnComplete: {
      age: 24 * 60 * 60 // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60 // Keep failed jobs for 7 days
    }
  }
};

// Mock implementation for development mode
class MockEmailQueue {
  private jobs: Map<string, { id: string, data: EmailJobData, status: string }> = new Map();
  
  constructor() {
    logger.warn('Using mock email queue - emails will be logged but not sent');
  }
  
  async add(name: string, data: EmailJobData, options: JobsOptions): Promise<{ id: string }> {
    const jobId = options.jobId || uuidv4();
    this.jobs.set(jobId, { id: jobId, data, status: 'waiting' });
    logger.info(`[MOCK] Email job added to queue with ID: ${jobId}`, { data });
    return { id: jobId };
  }
  
  async getJob(jobId: string): Promise<Job<EmailJobData> | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return job as any;
  }
  
  async close(): Promise<void> {
    logger.info('[MOCK] Email queue closed');
  }
  
  async waitUntilReady(): Promise<void> {
    logger.info('[MOCK] Email queue ready');
  }
  
  async getActiveCount(): Promise<number> {
    return 0;
  }
  
  async getWaitingCount(): Promise<number> {
    return this.jobs.size;
  }
  
  async getDelayedCount(): Promise<number> {
    return 0;
  }
  
  async getFailedCount(): Promise<number> {
    return 0;
  }
  
  async getFailed(): Promise<Job<EmailJobData>[]> {
    return [];
  }
  
  async clean(age: number, limit: number, type: string): Promise<Job<EmailJobData>[]> {
    return [];
  }
}

/**
 * Create the email queue (real or mock depending on environment)
 */
let emailQueue: Queue<EmailJobData> | MockEmailQueue;

try {
  if (config.isDevelopment && process.env.USE_MOCK_REDIS === 'true') {
    emailQueue = new MockEmailQueue() as any;
  } else {
    emailQueue = new Queue<EmailJobData>(QUEUE_NAME, queueOptions);
  }
} catch (error) {
  logger.error(`Error creating email queue: ${error}`);
  if (config.isDevelopment) {
    logger.warn('Falling back to mock email queue in development mode');
    emailQueue = new MockEmailQueue() as any;
  } else {
    throw error;
  }
}

export { emailQueue };

/**
 * Add an email to the queue
 */
export async function queueEmail(data: EmailJobData): Promise<string> {
  // Generate a unique job ID if not provided
  const jobId = uuidv4();
  
  // Default priority mapping (lower number = higher priority)
  const priorityMap: Record<string, number> = {
    high: 1,
    normal: 2,
    low: 3
  };
  
  // Set up job options
  const jobOptions: JobsOptions = {
    jobId,
    priority: data.priority ? priorityMap[data.priority] : priorityMap.normal,
  };
  
  // If a scheduledTime is provided, calculate the delay
  if (data.scheduledTime) {
    const now = new Date();
    const scheduledTime = new Date(data.scheduledTime);
    
    // Only set delay if the scheduled time is in the future
    if (scheduledTime > now) {
      jobOptions.delay = scheduledTime.getTime() - now.getTime();
    }
  }

  try {
    // Add the job to the queue
    await emailQueue.add('send-email', data, jobOptions);
    logger.info(`Email job added to queue with ID: ${jobId}`);
    return jobId;
  } catch (error) {
    logger.error(`Error adding email job to queue: ${error}`);
    if (config.isDevelopment) {
      // In development, just log the email instead of failing
      logger.info(`[DEV MODE] Email would be sent to: ${data.to}`, {
        subject: data.subject,
        body: data.text || data.html.substring(0, 100) + '...'
      });
      return jobId;
    }
    throw error;
  }
}

/**
 * Function to get a job by ID
 */
export async function getEmailJob(jobId: string): Promise<Job<EmailJobData> | null> {
  const job = await emailQueue.getJob(jobId);
  return job || null;
}

/**
 * Close the queue connections
 */
export async function closeEmailQueue(): Promise<void> {
  await emailQueue.close();
  logger.info('Email queue connections closed');
}

/**
 * Initialize the queue (call this during app startup)
 */
export async function initializeEmailQueue(): Promise<void> {
  try {
    // Make sure the queue is in a good state
    await emailQueue.waitUntilReady();
    logger.info('Email queue initialized successfully');
  } catch (error) {
    logger.error(`Error initializing email queue: ${error}`);
    throw error;
  }
}

/**
 * Determine if an email error is permanent (should not be retried)
 */
function isPermanentEmailError(error: any): boolean {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  // Common permanent email failure patterns
  const permanentFailurePatterns = [
    /invalid.*email/i,
    /no.*recipient/i,
    /invalid.*address/i,
    /address.*rejected/i,
    /mailbox.*unavailable/i,
    /mailbox.*disabled/i,
    /user.*suspended/i,
    /account.*disabled/i,
    /spam/i,
    /blocked/i,
    /denied/i,
    /exceeded/i,
    /limit/i,
    /complaint/i,
    /policy/i,
    /prohibited/i,
    /authentication.*failed/i,
    /bad.*credentials/i,
    /credentials.*rejected/i
  ];
  
  // Check if any permanent failure patterns match
  return permanentFailurePatterns.some(pattern => pattern.test(errorMsg));
} 