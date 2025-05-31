# Notification Logs

The Notification Log system provides comprehensive tracking, monitoring, and management of all notifications sent through the service. This feature improves observability, facilitates troubleshooting, and enables notification retries.

## Features

- **Complete Notification History**: Tracks every notification sent, including recipient, content, status, and metadata
- **Detailed Error Tracking**: Records all errors that occur during notification delivery
- **Retry Mechanism**: Supports manual and automatic retries of failed notifications
- **Filtering and Searching**: Comprehensive API for filtering logs by various criteria
- **Cleanup Management**: Automated cleanup of old logs to prevent database bloat
- **Observability**: Provides insights into notification delivery patterns, success rates, and issues

## Notification Log Model

Each notification log entry contains:

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier for the log entry |
| to | string | Recipient (email, phone, etc.) |
| type | string | Notification type (e.g., ORDER_CONFIRMED) |
| payload | JSON | Complete notification data |
| status | enum | Current status (queued, sending, sent, failed, retrying, canceled) |
| createdAt | Date | When the log entry was created |
| updatedAt | Date | When the log entry was last updated |
| sentAt | Date (optional) | When the notification was successfully sent |
| errorLog | string[] (optional) | Array of error messages if sending failed |
| retryCount | number | Number of retry attempts |
| nextRetryAt | Date (optional) | When to retry next |
| jobId | string (optional) | Reference to queue job ID |
| metadata | JSON (optional) | Additional metadata about the notification |

## API Endpoints

### List Notification Logs

```
GET /api/notification-logs
```

Retrieve notification logs with filtering, sorting, and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `status`: Filter by status (e.g., 'sent', 'failed')
- `type`: Filter by notification type
- `to`: Filter by recipient
- `createdFrom`: Filter by creation date (from)
- `createdTo`: Filter by creation date (to)
- `sentFrom`: Filter by sent date (from)
- `sentTo`: Filter by sent date (to)
- `retryCountMin`: Minimum retry count
- `retryCountMax`: Maximum retry count
- `jobId`: Filter by job ID
- `search`: Search term to match against recipient or type
- `sortBy`: Field to sort by (default: 'createdAt')
- `sortOrder`: Sort order ('asc' or 'desc', default: 'desc')

### Get Notification Log by ID

```
GET /api/notification-logs/:id
```

Retrieve a specific notification log by its ID.

### Delete Notification Log

```
DELETE /api/notification-logs/:id
```

Delete a specific notification log by its ID. This endpoint is restricted to admin users.

### Retry Failed Notification

```
POST /api/notification-logs/retry
```

Retry a failed notification.

**Request Body:**
```json
{
  "id": "notification-log-uuid"
}
```

### Bulk Retry Failed Notifications

```
POST /api/notification-logs/retry-bulk
```

Retry multiple failed notifications at once.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2"],  // Optional: specific notification IDs to retry
  "status": "failed",         // Optional: filter by status (default: 'failed')
  "limit": 50,                // Optional: maximum number to retry (default: 50, max: 100)
  "type": "ORDER_CONFIRMED"   // Optional: filter by notification type
}
```

### Cancel Notification

```
POST /api/notification-logs/cancel
```

Cancel a notification that hasn't been sent yet.

**Request Body:**
```json
{
  "id": "notification-log-uuid"
}
```

### Clean Up Old Logs

```
POST /api/notification-logs/cleanup
```

Delete old notification logs to save database space.

**Request Body:**
```json
{
  "olderThan": 30,                 // Optional: days (default: 30)
  "includeStatuses": ["sent"],     // Optional: statuses to include in cleanup
  "excludeStatuses": ["failed"],   // Optional: statuses to exclude (default: ['failed'])
  "limit": 1000                    // Optional: maximum logs to delete (default: 1000, max: 10000)
}
```

## Usage Examples

### Monitoring Failed Notifications

```typescript
// Get all failed notifications from the last 24 hours
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const response = await fetch('/api/notification-logs?status=failed&createdFrom=' + yesterday.toISOString());
const { logs, pagination } = await response.json();
```

### Retrying All Failed Order Confirmation Emails

```typescript
// Bulk retry all failed ORDER_CONFIRMED notifications
const response = await fetch('/api/notification-logs/retry-bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'failed',
    type: 'ORDER_CONFIRMED',
    limit: 100
  })
});
const result = await response.json();
console.log(`Retried ${result.retriedCount} notifications`);
```

## Authorization

All notification log endpoints require authentication. Additionally:

- Read operations (`GET` endpoints) require the `admin` or `support` role
- Write operations (`POST`, `DELETE` endpoints) generally require the `admin` role
- Retry operations may be accessible to `support` roles depending on the endpoint

## Troubleshooting

Common issues and solutions:

1. **Missing Logs**: Ensure the notification service is properly configured to create logs for all notifications.

2. **Failed Retries**: Check the original error message in the `errorLog` field to understand why the notification failed initially.

3. **Performance Issues**: If the logs table grows too large, consider:
   - Implementing more aggressive cleanup policies
   - Adding appropriate database indexes
   - Using database partitioning for high-volume deployments 