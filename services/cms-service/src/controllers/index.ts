import { ContentController } from './content.controller';
import { WidgetController } from './widget.controller';
import { logger } from '../utils/logger';

// Log controller initialization
logger.debug('Initializing controllers');

// Declare controller variables
let contentControllerInstance: typeof ContentController;
let widgetControllerInstance: WidgetController;

try {
  // Initialize controller instances
  logger.debug('Creating ContentController instance');
  contentControllerInstance = ContentController; // ContentController is already an instance
  logger.debug('ContentController initialized successfully');
  
  logger.debug('Creating WidgetController instance');
  widgetControllerInstance = new WidgetController();
  logger.debug('WidgetController initialized successfully');
} catch (error) {
  logger.error('Failed to initialize controllers', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });
  throw error;
}

// Export controller instances
export const contentController = contentControllerInstance;
export const widgetController = widgetControllerInstance; 