import fp from 'fastify-plugin';
import multipart, { MultipartFile } from '@fastify/multipart';
import { FastifyInstance, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pump = promisify(pipeline);

// Register fastify-multipart plugin
export const registerMultipart = fp(async (fastify: FastifyInstance) => {
  fastify.register(multipart);
});

// Utility to handle file upload and save to disk
export async function handleFileUpload(request: FastifyRequest) {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const data = await request.file();
  
  if (!data) {
    throw new Error('No file uploaded');
  }

  const filePath = path.join(uploadDir, data.filename);
  await pump(data.file, fs.createWriteStream(filePath));
  
  return {
    filename: data.filename,
    mimetype: data.mimetype,
    filepath: filePath
  };
} 