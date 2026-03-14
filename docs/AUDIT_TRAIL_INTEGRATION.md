# Audit Trail System Integration Guide

## Overview
The Alghahim Virtual Bank system includes a comprehensive audit trail system that tracks all user activity, logins with IP addresses, admin actions, and security events. This guide shows you how to integrate audit logging throughout the system.

## Features

### 1. Login Tracking
- Records all user login attempts with success/failure status
- Captures IP address, device type, browser, OS, and geolocation
- Tracks login method (password, biometric, etc.)

### 2. Admin Activity Logging
- Logs all admin actions (user suspension, transaction review, etc.)
- Records impact level (high, medium, low)
- Captures target user information and detailed change logs

### 3. Security Event Tracking
- Tracks suspicious activities (failed login attempts, data access anomalies)
- Severity levels: high, medium, low
- Provides resolution status and timestamps

### 4. Audit Logs
- General activity logging for compliance
- Supports resource tracking (which user/account was affected)
- Captures error messages for troubleshooting

## Implementation

### Step 1: Import Audit Logger

```typescript
import { 
  logLoginEvent, 
  logAdminAction, 
  logSecurityEvent, 
  logAuditEvent 
} from '@/lib/audit/logger'
```

### Step 2: Log Login Events

**In your authentication flow** (e.g., login API route):

```typescript
import { logLoginEvent } from '@/lib/audit/logger'

export async function loginUser(email: string, password: string, ipAddress: string) {
  try {
    // Your authentication logic here
    const user = await authenticateUser(email, password)
    
    // Log successful login
    await logLoginEvent({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
      loginMethod: 'password',
      success: true,
      deviceType: 'mobile', // or 'desktop', 'tablet'
      browser: 'Chrome',
      os: 'iOS',
      country: 'Kenya',
      city: 'Nairobi'
    })
    
    return user
  } catch (error) {
    // Log failed login
    await logLoginEvent({
      userId: email,
      email,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
      loginMethod: 'password',
      success: false,
      failureReason: error.message
    })
    
    throw error
  }
}
```

### Step 3: Log Admin Actions

**When admins perform critical actions**:

```typescript
import { logAdminAction } from '@/lib/audit/logger'

export async function suspendUserAccount(adminId: string, targetUserId: string) {
  try {
    // Suspend user logic
    await supabase.from('users').update({ is_active: false }).eq('id', targetUserId)
    
    // Log admin action
    await logAdminAction({
      adminId,
      action: 'USER_ACCOUNT_SUSPENDED',
      targetUserId,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      impact: 'high',
      details: {
        reason: 'Suspicious activity',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to suspend account:', error)
    throw error
  }
}
```

### Step 4: Log Security Events

**For suspicious activities**:

```typescript
import { logSecurityEvent } from '@/lib/audit/logger'

export async function detectAnomalousActivity(userId: string) {
  await logSecurityEvent({
    userId,
    eventType: 'MULTIPLE_FAILED_LOGINS',
    severity: 'high',
    description: 'User attempted login 5 times with wrong password',
    ipAddress: '192.168.1.1',
    resolved: false
  })
}
```

### Step 5: General Audit Logging

**For compliance and general tracking**:

```typescript
import { logAuditEvent } from '@/lib/audit/logger'

export async function updateUserProfile(userId: string, changes: any) {
  await supabase.from('user_profiles').update(changes).eq('user_id', userId)
  
  await logAuditEvent({
    userId,
    action: 'PROFILE_UPDATE',
    resourceType: 'user_profile',
    resourceId: userId,
    description: 'User updated their profile',
    changes,
    ipAddress: request.headers.get('x-forwarded-for'),
    status: 'success'
  })
}
```

## Accessing Audit Trails

### Admin Dashboard
Navigate to `/admin/audit-trail` to view:
- **Audit Logs Tab** - General system activity
- **Login Logs Tab** - All user login attempts with IP addresses
- **Admin Activity Tab** - Actions performed by administrators
- **Security Events Tab** - Suspicious activities and security incidents

### Features in Dashboard
- Search by user email or IP address
- Filter by date range (1 day, 7 days, 30 days, 90 days)
- Filter by action type or severity
- Export logs as CSV for compliance reports
- Real-time activity monitoring

## Email Forwarding

### Super Admin Email Configuration

All emails sent to `@bank.alghahim.co.ke` domain are automatically forwarded to the super admin email configured in:

**Environment Variable:**
```
SUPER_ADMIN_EMAIL=admin@alghahim.co.ke
```

### Email Audit Trail

Forwarded emails are logged in the `email_audit` table with:
- Sender email
- Recipient email (@bank.alghahim.co.ke)
- Subject line
- Timestamp
- Forward status

## Best Practices

1. **Log Early, Log Often** - Capture all security-relevant events
2. **Include Context** - Always provide IP addresses and user agents
3. **Use Appropriate Severity** - High for security events, medium for admin actions
4. **Regular Reviews** - Audit admins should review logs weekly
5. **Export for Compliance** - Generate CSV reports for compliance audits
6. **Monitor Patterns** - Look for suspicious login patterns or repeated failed attempts

## Security Considerations

- All audit logs are immutable (append-only)
- Row-level security ensures admins can only see appropriate logs
- IP addresses and user agents are captured for forensic analysis
- All timestamps are in UTC for consistency
- Sensitive data (passwords, pins) is never logged

## Troubleshooting

### Logs Not Appearing
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment
2. Check RLS policies on audit tables
3. Ensure user has admin role to view logs

### Email Not Forwarding
1. Verify `SUPER_ADMIN_EMAIL` environment variable is set
2. Check `RESEND_API_KEY` is valid
3. Ensure @bank.alghahim.co.ke domain is verified in Resend

### Missing IP Addresses
1. Ensure `x-forwarded-for` header is being passed
2. Check reverse proxy configuration
3. Verify `request.headers.get('x-forwarded-for')` is being called

## Support

For issues with audit logging, contact the admin team or review the detailed implementation in:
- `/lib/audit/logger.ts` - Audit logging functions
- `/app/(admin)/admin/audit-trail/page.tsx` - Audit dashboard
- `/scripts/setup-audit-system.sql` - Database schema
