# Notification Service

A microservice for handling email, SMS, and push notifications for the e-commerce platform.

## Features

- Email notifications via templating system
- Queued delivery using Redis and BullMQ
- Retry logic for failed notifications
- Metrics and monitoring
- Request validation using Zod schemas
- **Notification logs for tracking, observability, and retries**

## Authentication and Authorization

### JWT Authentication

The notification service uses JWT authentication for secured endpoints. To access protected routes, include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The JWT token should be signed with the same secret configured in the `JWT_SECRET` environment variable.

### Service-to-Service Authentication

For internal service-to-service communication, the notification service supports service token authentication. This allows other microservices to call the notification service without requiring a user JWT token.

To use service authentication, include the service token in the request headers:

```
X-Service-Token: <service_token>
X-Service-Name: <service_name>  # Optional but helpful for logging
```

Service tokens are configured via the `SERVICE_TOKENS` environment variable as a comma-separated list.

### Role-Based Access Control

Certain routes are protected by role-based access control (RBAC). The following roles are defined:

- `admin`: Full access to all endpoints, including testing and metrics
- `tester`: Access to basic notification testing endpoints
- `service`: Access for internal service-to-service communication
- `support`: Access to read notification logs and retry failed notifications

## Request Validation

The notification service uses Zod for request validation, ensuring that all incoming payloads meet the required schema before processing. This provides:

- Type-safe validation of request bodies, query parameters, and URL parameters
- Detailed validation error messages with the exact path and reason for validation failures
- Automatic type coercion (e.g., string to number) when appropriate
- Schema reuse across different parts of the application

Each notification type has its own schema that defines the required fields and their types, ensuring consistent data handling throughout the system.

## Notification Logs

The notification service includes a comprehensive logging system for tracking all notifications. This system provides:

- Complete history of all notifications sent through the service
- Detailed tracking of errors that occur during notification delivery
- Manual and automatic retry capabilities for failed notifications
- Filtering and searching of logs by various criteria
- Automated cleanup of old logs

See the [Notification Logs Documentation](./docs/notification-logs.md) for more details.

## Protected Routes

### Standard API Routes

| Method | Route | Description | Required Roles |
|--------|-------|-------------|---------------|
| POST | `/api/notifications/send` | Send a notification | Any authenticated user |
| GET | `/api/notifications/status/:jobId` | Get notification status | Any authenticated user |

### Notification Log Routes

| Method | Route | Description | Required Roles |
|--------|-------|-------------|---------------|
| GET | `/api/notification-logs` | List notification logs | `admin`, `support` |
| GET | `/api/notification-logs/:id` | Get notification log by ID | `admin`, `support` |
| DELETE | `/api/notification-logs/:id` | Delete notification log | `admin` |
| POST | `/api/notification-logs/retry` | Retry failed notification | `admin`, `support` |
| POST | `/api/notification-logs/retry-bulk` | Retry multiple failed notifications | `admin` |
| POST | `/api/notification-logs/cancel` | Cancel pending notification | `admin`, `support` |
| POST | `/api/notification-logs/cleanup` | Clean up old notification logs | `admin` |

### Health and Metrics Routes

| Method | Route | Description | Required Roles |
|--------|-------|-------------|---------------|
| GET | `/health` | Basic health check | None (public) |
| GET | `/health/queues` | Detailed queue metrics | `admin`, `service` |
| POST | `/health/queues/retry-failed` | Retry failed jobs | `admin` |
| POST | `/health/queues/clean-completed` | Clean completed jobs | `admin` |

### Testing Routes (Non-Production Only)

These routes are only available in non-production environments (development, test, staging).

| Method | Route | Description | Required Roles |
|--------|-------|-------------|---------------|
| POST | `/api/test/test-email` | Send test email | `admin`, `tester` |
| POST | `/api/test/test-all-templates` | Test all notification templates | `admin` |
| GET | `/api/test/failed-notifications` | Get recent failed notifications | `admin` |

## Environment Setup

The service requires the following environment variables:

```
PORT=3014
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
SERVICE_TOKENS=service_token_1,service_token_2  # Comma-separated list of service tokens
EMAIL_FROM=noreply@example.com
NOTIFY_MODE=log  # 'log', 'email', 'sms', 'all'
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
NODE_ENV=development  # 'development', 'test', 'staging', 'production'
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

Swagger documentation is available at `/documentation` when the service is running. 

## Additional Documentation

- [Notification Logs](./docs/notification-logs.md) - Detailed documentation on the notification logging system
- [Validation Examples](./docs/validation-examples.md) - Examples of using the validation middleware 

## Webhook Integration

The notification service includes a webhook system to receive delivery status callbacks from email service providers. This allows for:

1. **Accurate delivery tracking** - Update notification status based on actual delivery events
2. **Engagement tracking** - Record when emails are opened or clicked 
3. **Failure handling** - Identify permanent failures (bounces) vs. temporary issues
4. **Automatic retries** - Properly handle temporary failures with smart retry logic

### Setting Up Webhooks

To use the webhook system:

1. Configure your email service provider to send event callbacks to:
   - Main endpoint: `https://your-api.example.com/api/webhooks/email-status`
   - Provider-specific endpoint: `https://your-api.example.com/api/webhooks/sendgrid` (for SendGrid)

2. Add the webhook secret to your environment configuration:
   ```env
   EMAIL_WEBHOOK_SECRET=your-secret-key
   ```

3. The service will automatically process webhook events and update notification statuses.

### Supported Events

The webhook system normalizes events from different providers into a standard set:

- **Delivery events**: delivered
- **Engagement events**: opened, clicked
- **Failure events**: bounced, blocked, spam-complaint, dropped
- **Delay events**: deferred, delayed

### Retry System

Failed notifications can be retried manually or automatically:

1. **Manual retry**: Use the `/api/notification-logs/retry/:id` endpoint to retry a specific notification
2. **Batch retry**: Use the `/api/notification-logs/retry-all` endpoint to retry multiple failed notifications
3. **Automatic retry**: Temporary failures are automatically retried based on the configured backoff strategy

### Adding Support for New Email Providers

To add support for a new email provider:

1. Create a provider-specific validation schema in `webhook.routes.ts`
2. Add provider-specific event normalization in the `normalizeEventType` function
3. Create a dedicated endpoint if needed (similar to the SendGrid endpoint) 