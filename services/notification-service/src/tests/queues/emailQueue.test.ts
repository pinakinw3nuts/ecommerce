import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { queueEmail, emailQueue, closeEmailQueue } from '../../queues/emailQueue';
import { redisConnection } from '../../utils/redis';

// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

describe('Email Queue Tests', () => {
  // Setup: Clear the queue before all tests
  beforeAll(async () => {
    // Make sure the queue is empty before we start
    await emailQueue.obliterate({ force: true });
  });

  // Clean up: Remove any test jobs and close connections
  afterEach(async () => {
    // Clean up any jobs created during tests
    await emailQueue.clean(0, 1000);
  });

  afterAll(async () => {
    // Close queue connections after all tests
    await closeEmailQueue();
    await redisConnection.quit();
  });

  it('should enqueue an email job successfully', async () => {
    // Create test job data
    const emailJobData = {
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>',
      text: 'This is a test email',
      priority: 'normal' as const,
      metadata: {
        testId: 'email-queue-test',
        timestamp: new Date().toISOString()
      }
    };

    // Queue the email
    const jobId = await queueEmail(emailJobData);

    // Check that we got a valid job ID back
    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');

    // Get the job from the queue
    const job = await emailQueue.getJob(jobId);
    
    // Verify the job exists and has the correct data
    expect(job).toBeDefined();
    expect(job?.id).toBe(jobId);
    expect(job?.data).toMatchObject({
      to: emailJobData.to,
      subject: emailJobData.subject,
      html: emailJobData.html,
      text: emailJobData.text,
      priority: emailJobData.priority,
      metadata: expect.objectContaining({
        testId: 'email-queue-test'
      })
    });

    // Verify job status
    const jobStatus = await job?.getState();
    expect(jobStatus).toBe('waiting');
  });

  it('should handle job with scheduled time', async () => {
    // Create a job with a scheduled time in the future
    const futureDate = new Date(Date.now() + 60000); // 1 minute in the future
    
    const emailJobData = {
      to: 'scheduled@example.com',
      subject: 'Scheduled Test Email',
      html: '<p>This is a scheduled test email</p>',
      text: 'This is a scheduled test email',
      scheduledTime: futureDate,
      metadata: {
        testId: 'scheduled-email-test'
      }
    };

    // Queue the email with scheduling
    const jobId = await queueEmail(emailJobData);

    // Get the job
    const job = await emailQueue.getJob(jobId);
    
    // Verify the job exists
    expect(job).toBeDefined();
    
    // Check that the job has a delay
    expect(job?.opts).toHaveProperty('delay');
    
    // Verify job is in 'delayed' state
    const jobStatus = await job?.getState();
    expect(jobStatus).toBe('delayed');
  });

  it('should handle jobs with different priorities', async () => {
    // Queue three emails with different priorities
    const highPriorityEmail = {
      to: 'high@example.com',
      subject: 'High Priority',
      html: '<p>High priority email</p>',
      priority: 'high' as const
    };
    
    const normalPriorityEmail = {
      to: 'normal@example.com',
      subject: 'Normal Priority',
      html: '<p>Normal priority email</p>',
      priority: 'normal' as const
    };
    
    const lowPriorityEmail = {
      to: 'low@example.com',
      subject: 'Low Priority',
      html: '<p>Low priority email</p>',
      priority: 'low' as const
    };

    // Queue the emails
    const highJobId = await queueEmail(highPriorityEmail);
    const normalJobId = await queueEmail(normalPriorityEmail);
    const lowJobId = await queueEmail(lowPriorityEmail);

    // Get the jobs
    const highJob = await emailQueue.getJob(highJobId);
    const normalJob = await emailQueue.getJob(normalJobId);
    const lowJob = await emailQueue.getJob(lowJobId);

    // Verify all jobs exist
    expect(highJob).toBeDefined();
    expect(normalJob).toBeDefined();
    expect(lowJob).toBeDefined();

    // Check priorities
    expect(highJob?.opts).toHaveProperty('priority', 1); // Lower number = higher priority
    expect(normalJob?.opts).toHaveProperty('priority', 2);
    expect(lowJob?.opts).toHaveProperty('priority', 3);
  });

  it('should track metadata in the job', async () => {
    // Create email with detailed metadata
    const metadata = {
      notificationType: 'TEST_NOTIFICATION',
      userId: 'user-123',
      orderId: 'order-456',
      testRun: true,
      timestamp: new Date().toISOString()
    };

    const emailJobData = {
      to: 'metadata-test@example.com',
      subject: 'Metadata Test',
      html: '<p>Testing metadata</p>',
      metadata
    };

    // Queue the email
    const jobId = await queueEmail(emailJobData);
    const job = await emailQueue.getJob(jobId);

    // Verify metadata is preserved
    expect(job?.data.metadata).toEqual(expect.objectContaining(metadata));
  });
}); 