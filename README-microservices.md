# E-Commerce Microservices Startup Guide

This repository includes scripts to help you start the e-commerce microservices platform efficiently.

## Startup Options

You have two ways to start the services:

### 1. Cascading Startup (Recommended)

With the cascading approach, you only need to start the API Gateway, which will automatically start all required microservices:

```powershell
.\start-gateway.ps1
```

This script:
- Starts only the API Gateway
- The API Gateway then automatically starts all required microservices in the correct order
- Microservices are started in the background with proper dependency management

**Benefits:**
- Single command to start everything
- Simple "root-to-leaf" architecture
- Proper service dependency handling
- Automatic logging of service startup in API Gateway logs

### 2. Manual Control (Advanced)

If you need more control over which services to start, use the main script with different parameters:

```powershell
# Start all services including API Gateway
.\start-microservices.ps1

# Start only core services and API Gateway
.\start-microservices.ps1 -CoreServicesOnly

# Start only the API Gateway (without automatic microservice startup)
.\start-microservices.ps1 -ApiGatewayOnly
```

## Service Structure

The microservices are organized with the following priority levels:

1. **Core Services (Priority 1)**
   - auth-service (port 3001)
   - user-service (port 3002)

2. **Business Services (Priority 2)**
   - product-service (port 3003)
   - cart-service (port 3004)

3. **Order Processing (Priority 3)**
   - checkout-service (port 3005)
   - order-service (port 3006)
   - payment-service (port 3007)

4. **API Gateway (Priority 4)**
   - api-gateway (port 3000)

## Key Features

- **In-memory Cache**: The API Gateway is configured to use an in-memory cache instead of Redis
- **Dependency Management**: Services are started in order of priority
- **Port Conflict Detection**: Checks if ports are already in use
- **Package Management**: Automatically installs npm dependencies if needed
- **Error Handling**: Provides clear error messages and recovery suggestions

## Accessing the API

Once started, the API Gateway is available at:
- API Gateway URL: http://localhost:3000
- Health Check: http://localhost:3000/health
- API Status: http://localhost:3000/api/status

## Troubleshooting

If a service fails to start:
1. Check the startup logs for error messages
2. Verify the service directory exists and has a valid package.json
3. Try starting the service manually:
   ```
   cd services/<service-name>
   npm run dev
   ```
4. Check if the port is already in use by another process 