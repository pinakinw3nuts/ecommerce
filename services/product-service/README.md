# Product Service

## Overview
The Product Service is a Fastify-based microservice for managing products, categories, variants, and tags in an e-commerce platform. It supports CRUD operations, image uploads, and is designed for modular, scalable deployments.

## Features
- Product CRUD (with variants, tags, categories)
- Category CRUD
- Image upload support
- PostgreSQL with TypeORM
- Zod validation
- JWT-based authentication for admin routes

## Running with Docker

```bash
docker-compose up --build
```

This will start both the Product Service and a PostgreSQL database. The service will be available at `http://localhost:3003`.

## File Upload Directory
Uploaded files are stored in the `uploads/` directory, which is mounted as a Docker volume at `/app/uploads`.

## Environment Variables
- `PORT` - Port to run the service (default: 3003)
- `DATABASE_URL` - PostgreSQL connection string
- `FILE_STORAGE_PATH` - Path for uploaded files (default: ./uploads)

## API Endpoints

### Products
- `GET    /products`           — List all products
- `POST   /products`           — Create a new product
- `GET    /products/:id`       — Get product by ID
- `PUT    /products/:id`       — Update product by ID
- `DELETE /products/:id`       — Delete product by ID
- `POST   /products/upload`    — Upload product image

### Categories
- `GET    /categories`         — List all categories
- `POST   /categories`         — Create a new category (admin only)
- `PUT    /categories/:id`     — Update a category (admin only)
- `DELETE /categories/:id`     — Delete a category (admin only)

### Health Check
- `GET    /health`             — Service health check

## License
MIT 