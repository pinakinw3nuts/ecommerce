import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildApp } from '@/app.fastify';
import { FastifyInstance } from 'fastify';
import { ContentBlockType } from '@/entities/ContentBlock';

// Mock JWT authentication for protected routes
vi.mock('@/middleware/fastify/authGuard', () => ({
  authGuard: vi.fn().mockImplementation((request, reply, done) => {
    request.user = {
      id: 'test-admin-id',
      email: 'admin@test.com',
      roles: ['admin', 'editor'],
    };
    done();
  })
}));

describe('Content Routes', () => {
  let app: FastifyInstance;
  
  beforeEach(async () => {
    app = await buildApp();
  });
  
  describe('Content Creation and Retrieval Flow', () => {
    it('should create, retrieve, and toggle publication status of content', async () => {
      // Step 1: Create content
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/content',
        payload: {
          title: 'Integration Test Content',
          slug: 'integration-test',
          type: ContentBlockType.PAGE,
          content: { body: 'This is an integration test for content flow' },
          isPublished: false
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      // Verify creation response
      expect(createResponse.statusCode).toBe(201);
      const createData = JSON.parse(createResponse.body);
      expect(createData.success).toBe(true);
      expect(createData.data.id).toBeDefined();
      expect(createData.data.slug).toBe('integration-test');
      
      const contentId = createData.data.id;
      
      // Step 2: Retrieve content by slug (public endpoint)
      const getResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/content/integration-test'
      });
      
      // Verify retrieval response
      expect(getResponse.statusCode).toBe(200);
      const getData = JSON.parse(getResponse.body);
      expect(getData.success).toBe(true);
      expect(getData.data.title).toBe('Integration Test Content');
      expect(getData.data.isPublished).toBe(false);
      
      // Step 3: Publish the content
      const publishResponse = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/content/${contentId}/publish`,
        payload: {
          isPublished: true
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      // Verify publish response
      expect(publishResponse.statusCode).toBe(200);
      const publishData = JSON.parse(publishResponse.body);
      expect(publishData.success).toBe(true);
      expect(publishData.data.isPublished).toBe(true);
      expect(publishData.data.publishedAt).toBeDefined();
      
      // Step 4: Verify content is now published and available via published-only endpoint
      const publishedGetResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/content/integration-test?published=true'
      });
      
      // Verify published content retrieval
      expect(publishedGetResponse.statusCode).toBe(200);
      const publishedGetData = JSON.parse(publishedGetResponse.body);
      expect(publishedGetData.success).toBe(true);
      expect(publishedGetData.data.isPublished).toBe(true);
      
      // Step 5: Unpublish the content
      const unpublishResponse = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/content/${contentId}/publish`,
        payload: {
          isPublished: false
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      // Verify unpublish response
      expect(unpublishResponse.statusCode).toBe(200);
      const unpublishData = JSON.parse(unpublishResponse.body);
      expect(unpublishData.success).toBe(true);
      expect(unpublishData.data.isPublished).toBe(false);
      
      // Step 6: Verify content is no longer available via published-only endpoint
      const unpublishedGetResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/content/integration-test?published=true'
      });
      
      // Verify unpublished content not found in published-only query
      expect(unpublishedGetResponse.statusCode).toBe(404);
    });
    
    it('should schedule publication of content', async () => {
      // Step 1: Create content
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/content',
        payload: {
          title: 'Scheduled Content',
          slug: 'scheduled-content',
          type: ContentBlockType.PAGE,
          content: { body: 'This content will be scheduled for publication' }
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      // Verify creation
      expect(createResponse.statusCode).toBe(201);
      const createData = JSON.parse(createResponse.body);
      const contentId = createData.data.id;
      
      // Step 2: Schedule publication
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const scheduleResponse = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/content/${contentId}/publish`,
        payload: {
          isPublished: true,
          publishAt: tomorrow.toISOString(),
          expiresAt: null
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      // Verify scheduling
      expect(scheduleResponse.statusCode).toBe(200);
      const scheduleData = JSON.parse(scheduleResponse.body);
      expect(scheduleData.success).toBe(true);
      expect(scheduleData.data.publishAt).toBeDefined();
      
      // The content should not be published yet since it's scheduled for the future
      const publishedGetResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/content/scheduled-content?published=true'
      });
      
      // Verify not published yet
      expect(publishedGetResponse.statusCode).toBe(404);
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent content', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/content/non-existent-content'
      });
      
      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toBe('NOT_FOUND');
    });
    
    it('should return 401 for unauthorized access to admin endpoints', async () => {
      // Remove the mock temporarily to test auth failure
      vi.doMock('@/middleware/fastify/authGuard', () => ({
        authGuard: vi.fn().mockImplementation((request, reply) => {
          return reply.status(401).send({
            success: false,
            message: 'Authentication required',
            error: 'AUTH_REQUIRED'
          });
        })
      }));
      
      // Rebuild app to apply the new mock
      app = await buildApp();
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/content',
        payload: {
          title: 'Unauthorized Content',
          type: ContentBlockType.PAGE,
          content: { body: 'This should not be created' }
        }
      });
      
      expect(response.statusCode).toBe(401);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
      expect(data.error).toBe('AUTH_REQUIRED');
      
      // Restore the mock
      vi.doMock('@/middleware/fastify/authGuard', () => ({
        authGuard: vi.fn().mockImplementation((request, reply, done) => {
          request.user = {
            id: 'test-admin-id',
            email: 'admin@test.com',
            roles: ['admin', 'editor'],
          };
          done();
        })
      }));
    });
    
    it('should validate input and return 400 for invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/content',
        payload: {
          // Missing required title
          type: ContentBlockType.PAGE,
          content: { body: 'Invalid content' }
        },
        headers: {
          authorization: 'Bearer fake-token'
        }
      });
      
      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });
}); 