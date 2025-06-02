import { describe, it, expect, beforeEach } from 'vitest';
import { ContentService } from '@/services/content.service';
import { ContentBlockType } from '@/entities/ContentBlock';
import { AppDataSource } from '@/config/database';

describe('ContentService', () => {
  let contentService: ContentService;
  
  beforeEach(() => {
    contentService = new ContentService();
  });
  
  describe('Content Creation and Retrieval', () => {
    it('should create a new content block', async () => {
      // Create test content data
      const contentData = {
        title: 'Test Content',
        slug: 'test-content',
        type: ContentBlockType.PAGE,
        content: { body: 'This is test content' },
        isPublished: false
      };
      
      // Create content block
      const createdContent = await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Verify created content
      expect(createdContent).toBeDefined();
      expect(createdContent.id).toBeDefined();
      expect(createdContent.title).toBe(contentData.title);
      expect(createdContent.slug).toBe(contentData.slug);
      expect(createdContent.type).toBe(contentData.type);
      expect(createdContent.content).toEqual(contentData.content);
      expect(createdContent.isPublished).toBe(false);
      expect(createdContent.createdBy).toBe('test-user-id');
      expect(createdContent.createdAt).toBeInstanceOf(Date);
    });
    
    it('should generate a slug if not provided', async () => {
      // Create test content data without slug
      const contentData = {
        title: 'Test Content Without Slug',
        type: ContentBlockType.PAGE,
        content: { body: 'This is test content' }
      };
      
      // Create content block
      const createdContent = await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Verify slug was generated
      expect(createdContent.slug).toBeDefined();
      expect(createdContent.slug).toBe('test-content-without-slug');
    });
    
    it('should retrieve content block by slug', async () => {
      // Create test content data
      const contentData = {
        title: 'Retrievable Content',
        slug: 'retrievable-content',
        type: ContentBlockType.PAGE,
        content: { body: 'This content should be retrievable by slug' },
        isPublished: true
      };
      
      // Create content block
      await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Retrieve content by slug
      const retrievedContent = await contentService.getContentBlockBySlug('retrievable-content');
      
      // Verify retrieved content
      expect(retrievedContent).toBeDefined();
      expect(retrievedContent?.title).toBe(contentData.title);
      expect(retrievedContent?.slug).toBe(contentData.slug);
      expect(retrievedContent?.content).toEqual(contentData.content);
    });
    
    it('should retrieve content block by slug and type', async () => {
      // Create test content data
      const contentData = {
        title: 'Typed Content',
        slug: 'typed-content',
        type: ContentBlockType.BANNER,
        content: { body: 'This content should be retrievable by slug and type' },
        isPublished: true
      };
      
      // Create content block
      await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Retrieve content by slug and type
      const retrievedContent = await contentService.getContentBlockBySlugAndType(
        'typed-content',
        ContentBlockType.BANNER
      );
      
      // Verify retrieved content
      expect(retrievedContent).toBeDefined();
      expect(retrievedContent?.title).toBe(contentData.title);
      expect(retrievedContent?.type).toBe(ContentBlockType.BANNER);
      
      // Try to retrieve with wrong type
      const notFound = await contentService.getContentBlockBySlugAndType(
        'typed-content',
        ContentBlockType.PAGE
      );
      
      // Verify not found
      expect(notFound).toBeNull();
    });
    
    it('should not retrieve unpublished content when requesting published only', async () => {
      // Create unpublished content
      const contentData = {
        title: 'Unpublished Content',
        slug: 'unpublished-content',
        type: ContentBlockType.PAGE,
        content: { body: 'This content is not published' },
        isPublished: false
      };
      
      // Create content block
      await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Try to retrieve published content
      const publishedContent = await contentService.getPublishedContentBlockBySlug('unpublished-content');
      
      // Verify not found
      expect(publishedContent).toBeNull();
      
      // Retrieve any content (published or not)
      const anyContent = await contentService.getContentBlockBySlug('unpublished-content');
      
      // Verify found
      expect(anyContent).toBeDefined();
      expect(anyContent?.isPublished).toBe(false);
    });
  });
  
  describe('Publication Status Toggle', () => {
    it('should toggle publication status', async () => {
      // Create unpublished content
      const contentData = {
        title: 'Toggle Publication Test',
        slug: 'toggle-publication',
        type: ContentBlockType.PAGE,
        content: { body: 'This content will have its publication status toggled' },
        isPublished: false
      };
      
      // Create content block
      const createdContent = await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Verify initially unpublished
      expect(createdContent.isPublished).toBe(false);
      
      // Toggle publication status to published
      const publishedContent = await contentService.updatePublicationStatus(
        createdContent.id,
        true,
        'test-user-id'
      );
      
      // Verify now published
      expect(publishedContent.isPublished).toBe(true);
      expect(publishedContent.publishedAt).toBeDefined();
      expect(publishedContent.publishedBy).toBe('test-user-id');
      
      // Toggle back to unpublished
      const unpublishedContent = await contentService.updatePublicationStatus(
        createdContent.id,
        false,
        'test-user-id'
      );
      
      // Verify now unpublished
      expect(unpublishedContent.isPublished).toBe(false);
    });
    
    it('should schedule publication', async () => {
      // Create unpublished content
      const contentData = {
        title: 'Scheduled Publication Test',
        slug: 'scheduled-publication',
        type: ContentBlockType.PAGE,
        content: { body: 'This content will be scheduled for publication' },
        isPublished: false
      };
      
      // Create content block
      const createdContent = await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Set publication date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Schedule publication
      const scheduledContent = await contentService.schedulePublication(
        createdContent.id,
        tomorrow,
        null,
        'test-user-id'
      );
      
      // Verify scheduled
      expect(scheduledContent.isPublished).toBe(false); // Not published yet
      expect(scheduledContent.publishAt).toBeInstanceOf(Date);
      expect(scheduledContent.publishAt?.getDate()).toBe(tomorrow.getDate());
      expect(scheduledContent.expiresAt).toBeNull();
    });
    
    it('should schedule publication with expiration', async () => {
      // Create unpublished content
      const contentData = {
        title: 'Expiring Publication Test',
        slug: 'expiring-publication',
        type: ContentBlockType.PAGE,
        content: { body: 'This content will be scheduled for publication with expiration' },
        isPublished: false
      };
      
      // Create content block
      const createdContent = await contentService.createContentBlock(contentData, 'test-user-id');
      
      // Set publication date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Set expiration date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      // Schedule publication with expiration
      const scheduledContent = await contentService.schedulePublication(
        createdContent.id,
        tomorrow,
        nextWeek,
        'test-user-id'
      );
      
      // Verify scheduled with expiration
      expect(scheduledContent.isPublished).toBe(false); // Not published yet
      expect(scheduledContent.publishAt).toBeInstanceOf(Date);
      expect(scheduledContent.publishAt?.getDate()).toBe(tomorrow.getDate());
      expect(scheduledContent.expiresAt).toBeInstanceOf(Date);
      expect(scheduledContent.expiresAt?.getDate()).toBe(nextWeek.getDate());
    });
  });
}); 