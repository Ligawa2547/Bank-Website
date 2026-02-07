# Audit Trail & Email Forwarding System

## Overview

The audit trail system provides comprehensive tracking of all system activities, user logins, admin actions, and security events. This documentation covers implementation, configuration, and usage.

## Features

### 1. **Comprehensive Activity Logging**
- System audit logs for all actions
- User login tracking with IP addresses and geo-location
- Admin activity tracking with target user information
- Security event monitoring and alerting

### 2. **Super Admin Email Forwarding**
- Automatically forwards all emails sent to `@bank.alghahim.co.ke` domain to super admin
- Logs all forwarded emails for audit purposes
- Tracks email sender, recipient, and forwarding timestamp

### 3. **Data Export**
- Export audit logs to CSV format
- Filter by date range, action type, or search query
- Compliance-ready reporting

## Database Tables

### audit_logs
Tracks all system activities and changes.

```sql
- id: Unique identifier
- user_id: User who performed the action
- admin_id: Admin who performed the action
- action: What action was performed
- resource_type: Type of resource affected (user, transaction, etc.)
- resource_id: ID of affected resource
- description: Human-readable description
- changes: JSON object of what changed
- ip_address: IP address of the requester
- user_agent: Browser/client information
- status: success or failure
- error_message: Error details if failed
- timestamp: When the action occurred
```

### login_logs
Tracks all user authentication events.

```sql
- id: Unique identifier
- user_id: User who logged in
- email: Email address used
- ip_address: IP address of login
- user_agent: Browser/device info
- login_method: password, oauth, etc.
- success: Boolean success/failure
- failure_reason: Why login failed
- device_type: Desktop, mobile, tablet
- browser: Browser name
- os: Operating system
- country: Country of login
- city: City of login
- latitude/longitude: Geographic coordinates
- timestamp: When login occurred
```

### admin_activity_logs
Tracks all admin actions with impact assessment.

```sql
- id: Unique identifier
- admin_id: Admin user ID
- email: Admin email
- action: Action performed
- target_user_id: User affected by action
- target_email: Email of affected user
- details: JSON details of action
- ip_address: Admin's IP address
- user_agent: Admin's browser info
- impact: high, medium, or low
- timestamp: When action occurred
```

### security_events
Tracks suspicious activities and security incidents.

```sql
- id: Unique identifier
- user_id: User involved in event
- event_type: Type of security event
- severity: high, medium, low
- description: Event description
- ip_address: IP address involved
- user_agent: Browser/device info
- metadata: Additional JSON data
- resolved: Boolean resolution status
- resolved_by: Admin who resolved it
- resolved_at: Resolution timestamp
- timestamp: When event occurred
```

### email_audit
Tracks all emails sent to and from `@bank.alghahim.co.ke` domain.

```sql
- id: Unique identifier
- recipient_email: Email recipient
- sender_email: Email sender
- subject: Email subject
- message_id: Resend message ID
- forwarded_to_super_admin: Boolean
- forwarded_at: Timestamp of forwarding
- status: received, forwarded, failed
- timestamp: When email was received
```

## Implementation Guide

### 1. **Logging User Activity**

Use the `logAuditEvent` function from `lib/audit/logger.ts`:

```typescript
import { logAuditEvent } from "@/lib/audit/logger"

await logAuditEvent({
  userId: user.id,
  action: "user_profile_updated",
  resourceType: "user_profile",
  resourceId: user.id,
  description: `User updated their profile`,
  changes: {
    before: oldData,
    after: newData,
  },
  ipAddress: request.ip,
  userAgent: request.headers.get("user-agent"),
  status: "success",
})
```

### 2. **Logging Login Events**

Use the `logLoginEvent` function in your auth handler:

```typescript
import { logLoginEvent } from "@/lib/audit/logger"

await logLoginEvent({
  userId: user.id,
  email: user.email,
  ipAddress: request.ip,
  userAgent: request.headers.get("user-agent"),
  success: true,
  loginMethod: "password",
})
```

### 3. **Logging Admin Actions**

Use the `logAdminActivity` function:

```typescript
import { logAdminActivity } from "@/lib/audit/logger"

await logAdminActivity({
  adminId: admin.id,
  email: admin.email,
  action: "user_suspended",
  targetUserId: targetUser.id,
  targetEmail: targetUser.email,
  details: { reason: "Suspicious activity" },
  ipAddress: request.ip,
  impact: "high",
})
```

### 4. **Logging Security Events**

Use the `logSecurityEvent` function:

```typescript
import { logSecurityEvent } from "@/lib/audit/logger"

await logSecurityEvent(
  "multiple_failed_login_attempts",
  user.id,
  "User attempted login 5+ times with incorrect password",
  "high",
  request.ip
)
```

### 5. **Email Forwarding Configuration**

Set the super admin email in environment variables:

```env
SUPER_ADMIN_EMAIL=admin@bank.alghahim.co.ke
```

The system automatically forwards all emails sent to `@bank.alghahim.co.ke` domain to the super admin email.

## Audit Trail Dashboard

Access the audit trail dashboard at: `https://admin.bank.alghahim.co.ke/admin/audit-trail`

### Features:

1. **Audit Logs Tab**
   - View all system activities
   - Filter by action, status, or date range
   - Export to CSV

2. **Login Logs Tab**
   - See all user authentication events
   - View IP addresses and geographic location
   - Identify suspicious login patterns

3. **Admin Activity Tab**
   - Track all admin actions
   - View impact assessment
   - Monitor admin behavior

4. **Security Events Tab**
   - View all security incidents
   - Filter by severity level
   - Mark events as resolved

## API Endpoints

### Forward Email to Super Admin

**POST** `/api/admin/email-forward`

```json
{
  "senderEmail": "user@example.com",
  "subject": "Important Message",
  "htmlContent": "<p>Email content</p>",
  "recipientEmail": "support@bank.alghahim.co.ke",
  "messageId": "resend-message-id"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "forwarded-message-id"
}
```

## Row Level Security (RLS) Policies

All audit tables have RLS enabled:

- **Super admins**: Can view and manage all audit data
- **Regular admins**: Can view audit data (read-only)
- **System processes**: Can insert audit logs

## Best Practices

1. **Log at Critical Points**
   - User authentication
   - Admin actions
   - Financial transactions
   - Account changes
   - Security events

2. **Include Sufficient Context**
   - IP address and user agent
   - What changed and why
   - Who initiated the action
   - Timestamp for correlation

3. **Regular Review**
   - Monitor security events daily
   - Review admin activities weekly
   - Audit login patterns for anomalies

4. **Retention Policy**
   - Keep audit logs for 12+ months
   - Archive older logs separately
   - Never delete audit logs

5. **Performance**
   - Indexes on common queries
   - Pagination for large result sets
   - Async logging to avoid blocking

## Compliance & Security

- All audit data is stored securely in Supabase
- Email forwarding uses verified Resend domain
- RLS ensures data access control
- Comprehensive logging for regulatory compliance
- Activity export for audit reports

## Troubleshooting

### Emails not being forwarded?
- Check `SUPER_ADMIN_EMAIL` environment variable
- Verify Resend API key is set
- Check email_audit table for failures

### Missing audit logs?
- Ensure logging functions are called
- Check for errors in console
- Verify database connectivity

### Performance issues?
- Check index usage
- Implement pagination
- Archive old logs to separate table

## Integrations

- **Resend**: Email forwarding and notifications
- **Supabase**: Database and RLS management
- **Next.js Middleware**: IP address capture
- **GeoIP Service**: Optional geo-location enrichment
