import { FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';

// Define the storage root at the project root level
// Determine the project root and set storage directory
let STORAGE_ROOT: string;

// Try different approaches to find the correct root path
if (process.env.PROJECT_ROOT) {
  // If explicitly defined
  STORAGE_ROOT = path.join(process.env.PROJECT_ROOT, 'storage');
} else {
  // Default to project root based on current working directory
  STORAGE_ROOT = path.resolve(process.cwd(), '..', '..', 'storage');
  
  // Check if this directory exists or can be created
  try {
    if (!fs.existsSync(STORAGE_ROOT)) {
      // Try a different path if the default doesn't work
      STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
    }
  } catch (error) {
    // Fallback to a location we know should be writable
    STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
  }
}

// Create the storage directory if it doesn't exist
console.log(`Storage root path: ${STORAGE_ROOT}`);
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Absolute path to file: ${__dirname}`);

try {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    console.log(`Created storage root directory at: ${STORAGE_ROOT}`);
  } else {
    console.log(`Storage root directory exists at: ${STORAGE_ROOT}`);
    // List contents of the storage directory
    const files = fs.readdirSync(STORAGE_ROOT);
    console.log(`Storage directory contents: ${files.join(', ') || 'empty'}`);
  }
} catch (error: any) {
  console.error(`Error with storage root directory: ${error.message || String(error)}`);
}

// Legacy function for compatibility
export async function handleFileUpload(request: FastifyRequest): Promise<{ filepath: string }> {
  try {
    const imageUrl = await handleProductImageUpload(request);
    return { filepath: imageUrl };
  } catch (error) {
    throw error;
  }
}

// Utility to handle product image upload
export async function handleProductImageUpload(request: FastifyRequest): Promise<string> {
  const data = await request.file();
  
  if (!data) {
    throw new Error('No image file uploaded');
  }
  
  // Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Create products directory if it doesn't exist
  const uploadDir = path.join(STORAGE_ROOT, 'products');
  console.log(`Product upload directory path: ${uploadDir}`);
  
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created products upload directory at: ${uploadDir}`);
    } catch (error: any) {
      console.error(`Error creating directory ${uploadDir}:`, error);
      throw new Error(`Failed to create upload directory: ${error.message || String(error)}`);
    }
  } else {
    console.log(`Products directory exists at: ${uploadDir}`);
  }

  // Generate unique filename
  const fileExtension = path.extname(data.filename);
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  console.log(`Saving product image to: ${filePath}`);
  
  // Save file
  try {
    await pipeline(data.file, fs.createWriteStream(filePath));
    console.log(`Product image saved successfully at: ${filePath}`);
  } catch (error: any) {
    console.error(`Error saving file to ${filePath}:`, error);
    throw new Error(`Failed to save uploaded file: ${error.message || String(error)}`);
  }
  
  // Return the relative URL path for the image
  const relativePath = `/storage/products/${uniqueFilename}`;
  console.log(`Returning relative image path: ${relativePath}`);
  return relativePath;
}

// Utility to handle category image upload
export async function handleCategoryImageUpload(request: FastifyRequest): Promise<string> {
  const data = await request.file();
  
  if (!data) {
    throw new Error('No image file uploaded');
  }
  
  // Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Create directory if it doesn't exist
  const uploadDir = path.join(STORAGE_ROOT, 'categories');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created categories upload directory at: ${uploadDir}`);
  }

  // Generate unique filename
  const fileExtension = path.extname(data.filename);
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // Save file
  await pipeline(data.file, fs.createWriteStream(filePath));
  
  console.log(`Category image saved at: ${filePath}`);
  
  // Return the relative URL path for the image
  return `/storage/categories/${uniqueFilename}`;
}

// Utility to handle brand image upload
export async function handleBrandImageUpload(request: FastifyRequest): Promise<string> {
  const data = await request.file();
  
  if (!data) {
    throw new Error('No image file uploaded');
  }
  
  // Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Create directory if it doesn't exist
  const uploadDir = path.join(STORAGE_ROOT, 'brands');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created brands upload directory at: ${uploadDir}`);
  }

  // Generate unique filename
  const fileExtension = path.extname(data.filename);
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // Save file
  await pipeline(data.file, fs.createWriteStream(filePath));
  
  console.log(`Brand image saved at: ${filePath}`);
  
  // Return the relative URL path for the image
  return `/storage/brands/${uniqueFilename}`;
}

// Utility to handle banner image upload
export async function handleBannerImageUpload(request: FastifyRequest): Promise<string> {
  const data = await request.file();
  
  if (!data) {
    throw new Error('No image file uploaded');
  }
  
  // Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(data.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  // Create directory if it doesn't exist
  const uploadDir = path.join(STORAGE_ROOT, 'banners');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate unique filename
  const fileExtension = path.extname(data.filename);
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  
  // Save file
  await pipeline(data.file, fs.createWriteStream(filePath));
  
  console.log(`Banner image saved at: ${filePath}`);
  
  // Return the relative URL path for the image
  return `/storage/banners/${uniqueFilename}`;
} 