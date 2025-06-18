# Order Service Postman Tests

This document provides a comprehensive set of Postman tests for the Order Service. You can import these into Postman to test the API endpoints with proper authentication.

## Prerequisites

1. Postman desktop or web app installed
2. Order Service running on localhost:3006
3. Valid JWT tokens (can be generated using `node setup-jwt.js`)

## Setup Instructions

1. Import the collection into Postman
2. Set up environment variables:
   - `baseUrl`: `http://localhost:3006`
   - `userToken`: (Your valid user JWT token)
   - `adminToken`: (Your valid admin JWT token)

## Test Collection

Below is the Postman collection in JSON format. You can copy this and import it directly into Postman.

```json
{
  "info": {
    "name": "Order Service API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        },
        "description": "Checks if the service is up and running"
      }
    },
    {
      "name": "Public - Get All Orders",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "public", "orders"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "limit",
              "value": "10"
            }
          ]
        },
        "description": "Get all orders for the authenticated user",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{userToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Public - Get Order By ID",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/orders/{{orderId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "public", "orders", "{{orderId}}"]
        },
        "description": "Get a specific order by ID",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{userToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Protected - Create Order",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{baseUrl}}/api/v1/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "orders"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n    \"items\": [\n        {\n            \"productId\": \"product-123\",\n            \"quantity\": 2,\n            \"price\": 49.99,\n            \"metadata\": {\n                \"name\": \"Premium Oil Filter\",\n                \"sku\": \"OIL-FIL-001\",\n                \"image\": \"/images/products/oil-filter.jpg\"\n            }\n        }\n    ],\n    \"shippingAddress\": {\n        \"street\": \"123 Main St\",\n        \"city\": \"Anytown\",\n        \"state\": \"CA\",\n        \"country\": \"US\",\n        \"postalCode\": \"12345\"\n    },\n    \"billingAddress\": {\n        \"street\": \"123 Main St\",\n        \"city\": \"Anytown\",\n        \"state\": \"CA\",\n        \"country\": \"US\",\n        \"postalCode\": \"12345\"\n    }\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "description": "Create a new order",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{userToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Protected - Get All Orders",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "orders"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "limit",
              "value": "10"
            },
            {
              "key": "status",
              "value": "PENDING"
            }
          ]
        },
        "description": "Get all orders (protected endpoint)",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{userToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Protected - Get Order By ID",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/orders/{{orderId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "orders", "{{orderId}}"]
        },
        "description": "Get a specific order by ID (protected endpoint)",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{userToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Admin - Add Note to Order",
      "request": {
        "method": "POST",
        "url": {
          "raw": "{{baseUrl}}/api/v1/admin/orders/{{orderId}}/notes",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "admin", "orders", "{{orderId}}", "notes"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n    \"content\": \"This is an admin note on the order.\",\n    \"isInternal\": true\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "description": "Add a note to an order (admin only)",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{adminToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Admin - Update Order Status",
      "request": {
        "method": "PATCH",
        "url": {
          "raw": "{{baseUrl}}/api/v1/admin/orders/{{orderId}}/status",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "admin", "orders", "{{orderId}}", "status"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n    \"status\": \"SHIPPED\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "description": "Update order status (admin only)",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{adminToken}}",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Invalid Token Test",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "orders"]
        },
        "description": "Test with invalid token",
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "invalid.token.value",
              "type": "string"
            }
          ]
        }
      }
    },
    {
      "name": "Missing Token Test",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/v1/orders",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "orders"]
        },
        "description": "Test with no token"
      }
    }
  ],
  "event": [
    {
      "listen": "prerequest",
      "script": {
        "type": "text/javascript",
        "exec": [
          ""
        ]
      }
    },
    {
      "listen": "test",
      "script": {
        "type": "text/javascript",
        "exec": [
          "// Common tests for all requests",
          "pm.test(\"Response time is acceptable\", function () {",
          "    pm.expect(pm.response.responseTime).to.be.below(1000);",
          "});",
          "",
          "// For successful responses",
          "if (pm.response.code >= 200 && pm.response.code < 300) {",
          "    pm.test(\"Content-Type header is present\", function () {",
          "        pm.response.to.have.header(\"Content-Type\");",
          "    });",
          "    ",
          "    pm.test(\"Response has valid JSON body\", function () {",
          "        pm.response.to.be.withBody;",
          "        pm.response.to.be.json;",
          "    });",
          "}",
          "",
          "// For error responses",
          "if (pm.response.code >= 400) {",
          "    pm.test(\"Error response has message\", function () {",
          "        var jsonData = pm.response.json();",
          "        pm.expect(jsonData).to.have.property('message');",
          "    });",
          "}"
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3006"
    },
    {
      "key": "orderId",
      "value": "00000000-0000-0000-0000-000000000000"
    }
  ]
}
```

## Test Cases

### Authentication Tests

1. **Test Case**: Public endpoint with valid token
   - **Endpoint**: GET `/api/v1/public/orders`
   - **Expected Result**: 200 OK with order data

2. **Test Case**: Protected endpoint with valid token
   - **Endpoint**: GET `/api/v1/orders`
   - **Expected Result**: 200 OK with order data

3. **Test Case**: Admin endpoint with user token
   - **Endpoint**: GET `/api/v1/admin/orders`
   - **Expected Result**: 403 Forbidden

4. **Test Case**: Admin endpoint with admin token
   - **Endpoint**: GET `/api/v1/admin/orders`
   - **Expected Result**: 200 OK

5. **Test Case**: Protected endpoint with invalid token
   - **Endpoint**: GET `/api/v1/orders`
   - **Expected Result**: 401 Unauthorized

6. **Test Case**: Protected endpoint with no token
   - **Endpoint**: GET `/api/v1/orders`
   - **Expected Result**: 401 Unauthorized

### Order Management Tests

1. **Test Case**: Create a new order
   - **Endpoint**: POST `/api/v1/orders`
   - **Expected Result**: 201 Created with order data

2. **Test Case**: Get all orders
   - **Endpoint**: GET `/api/v1/orders`
   - **Expected Result**: 200 OK with order data

3. **Test Case**: Get a specific order
   - **Endpoint**: GET `/api/v1/orders/{orderId}`
   - **Expected Result**: 200 OK with order data

4. **Test Case**: Update order status
   - **Endpoint**: PATCH `/api/v1/admin/orders/{orderId}/status`
   - **Expected Result**: 200 OK with updated order data

5. **Test Case**: Add a note to an order
   - **Endpoint**: POST `/api/v1/admin/orders/{orderId}/notes`
   - **Expected Result**: 201 Created with note data

## Environment Variables

Create a Postman environment with the following variables:

| Variable     | Initial Value                      | Description                                |
|--------------|------------------------------------|--------------------------------------------|
| baseUrl      | http://localhost:3006              | Base URL of the Order Service              |
| userToken    | (Generated from setup-jwt.js)      | JWT token for a regular user               |
| adminToken   | (Generated from setup-jwt.js)      | JWT token for an admin user                |
| orderId      | (ID of an existing order)          | Order ID to use in requests                |

## Running the Tests

1. Select the imported collection
2. Choose the environment you created
3. Click the "Run" button to run all tests
4. Review the test results

## Troubleshooting

If tests fail, check:

1. Is the Order Service running?
2. Are your JWT tokens valid and not expired?
3. Does the orderId variable point to an existing order?
4. Is the database properly configured and connected? 