# Storage System

## Overview

The storage system organizes assets (images, documents, etc.) for the e-commerce platform. Assets are organized in dedicated directories to ensure consistent structure across the application.

## Directory Structure

```
/ecommerce/               # Project root
  /storage/               # Centralized storage location
    /brands/              # Brand logos and images
    /categories/          # Category images
    /products/            # Product images
    /banners/             # Marketing banners
    /uploads/             # General uploads
  /apps/
    /storefront/
      /public/
        /storage/         # Storage copy
    /admin-panel/
      /public/
        /storage/         # Storage copy
```

## Quick Start

### Testing the System

To test the storage system, you can run the test script:

```bash
npm run storage:test
```

This will create sample image files in all storage folders for testing purposes.

## Using Images in Code

When referencing images in your frontend code, use the path `/storage/{type}/{filename}`:

```html
<!-- Example image in React/HTML -->
<img src="/storage/brands/acme-logo.png" alt="ACME Logo" />
```

```typescript
// Example in TypeScript/JavaScript
const productImage = `/storage/products/${product.image}`;
```

## Troubleshooting

If you encounter issues with images:

1. Check that the storage directories exist in the appropriate locations
2. Verify that image files are present in the correct directories
3. Ensure the image paths in your code match the actual file locations
4. Check console for any error messages related to image loading

## Additional Documentation

For more detailed information, see the full documentation in [docs/storage-system.md](docs/storage-system.md). 