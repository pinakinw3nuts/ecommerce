# Storefront Product API Integration

This document explains how the storefront application connects to the product-service microservice through the API gateway.

## Overview

The storefront now fetches real product data from the product-service microservice through the API gateway instead of using mock data. This allows for a more realistic e-commerce experience with actual product data from the backend.

## Configuration

The integration uses the following environment variables:

- `API_GATEWAY_URL`: The URL of the API gateway (default: `http://localhost:3000`)
- `USE_MOCK_DATA`: Set to `true` to use mock data instead of real API data (default: `false`)

These variables are configured in:
1. The `next.config.js` file for local development
2. The `docker-compose.dev.yml` file for Docker development

## How It Works

1. The storefront's product list page (`/products`) makes a request to the internal API route (`/api/products`)
2. The internal API route forwards the request to the product-service through the API gateway
3. The product-service returns the product data, which is then transformed to match the expected format for the frontend
4. If the API call fails, the system falls back to mock data to ensure the UI always has something to display

## API Parameters Mapping

The frontend parameters are mapped to the product-service API parameters as follows:

| Frontend Parameter | API Parameter   | Notes                                       |
|-------------------|-----------------|---------------------------------------------|
| category          | categoryId      | Only sent if not 'all'                      |
| search            | search          | Direct mapping                              |
| sort              | sortBy/sortOrder| Mapped from frontend options to API options |
| page              | page            | Direct mapping                              |
| limit             | limit           | Direct mapping                              |
| minPrice          | minPrice        | Direct mapping                              |
| maxPrice          | maxPrice        | Direct mapping                              |
| featured          | isFeatured      | Only sent if true                           |

## Sort Options Mapping

| Frontend Sort Option | API sortBy    | API sortOrder |
|---------------------|---------------|--------------|
| newest              | createdAt     | DESC         |
| price-asc           | price         | ASC          |
| price-desc          | price         | DESC         |
| popular             | popularity    | DESC         |

## Testing

To test the integration:

1. Start the microservices using Docker Compose:
   ```
   docker-compose -f docker-compose.dev.yml up
   ```

2. Visit the storefront products page at `http://localhost:3000/products`

3. To force using mock data, set `USE_MOCK_DATA=true` in the environment variables.

## Troubleshooting

If products are not loading:

1. Check that the API gateway is running and accessible
2. Check the browser console for any API errors
3. Verify that the product-service is running and properly configured
4. Check the API gateway logs for any routing issues

The system will automatically fall back to mock data if the API call fails, ensuring that the UI always displays something even if the backend services are unavailable. 