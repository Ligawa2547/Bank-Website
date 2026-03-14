# Admin Email Management System

## Overview

The Admin Email Management System enables Alghahim Virtual Bank administrators to send, receive, and track emails using the verified domain `bank.alghahim.co.ke`.

## Features

### 1. **Email Sending**
- Send emails from the verified domain
- HTML content editor with live preview
- Recipient validation
- Subject and content requirements
- Email logging and tracking

### 2. **Email History**
- View all sent emails
- Track email status (Sent, Failed, Pending)
- View delivery logs
- Error messages for failed sends
- Timestamp tracking

### 3. **Email Logging**
- All emails are automatically logged in the database
- Tracks sender, recipient, subject, and content
- Records status and error messages
- Links emails to admin users who sent them

### 4. **Access Control**
- Admin-only access (verified via @alghahim.co.ke email domain)
- Row-level security policies on all email tables
- Only admins can view and manage emails

## Technical Implementation

### Database Tables

#### `email_logs`
Tracks all outbound emails sent from the admin panel.

Columns:
- `id` (BIGSERIAL): Primary key
- `recipient_email` (TEXT): Email recipient
- `sender_email` (TEXT): Email sender (verified domain)
- `subject` (TEXT): Email subject
- `html` (TEXT): HTML content
- `text_content` (TEXT): Plain text version
- `status` (VARCHAR): 'pending', 'sent', or 'failed'
- `error_message` (TEXT): Error details if failed
- `resend_id` (VARCHAR): Resend service ID
- `sent_by` (UUID): Admin user who sent the email
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

#### `email_inbound`
Tracks incoming emails received at the domain.

Columns:
- `id` (BIGSERIAL): Primary key
- `sender_email` (TEXT): Email sender
- `recipient_email` (TEXT): Email recipient
- `subject` (TEXT): Email subject
- `html` (TEXT): HTML content
- `text_content` (TEXT): Plain text version
- `message_id` (VARCHAR): Message ID from email provider
- `received_at` (TIMESTAMP): Reception timestamp
- `processed` (BOOLEAN): Whether processed by system

#### `email_templates`
Pre-built email templates for common communications.

Columns:
- `id` (BIGSERIAL): Primary key
- `name` (VARCHAR): Template name (unique)
- `subject` (TEXT): Template subject line
- `html_template` (TEXT): Template HTML
- `description` (TEXT): Template description
- `created_by` (UUID): Admin who created template
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

### API Endpoints

#### `POST /api/admin/send-email`

Sends an email from the admin panel.

**Authentication:** Required (admin user)

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<html>Email content</html>",
  "from": "Alghahim Virtual Bank <noreply@bank.alghahim.co.ke>" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "id": "email-id-from-resend"
  }
}
```

**Error Response:**
```json
{
  "error": "Error message describing what went wrong"
}
```

### Resend Configuration

The system uses Resend for email delivery:

- **Domain:** bank.alghahim.co.ke (verified)
- **From Address:** noreply@bank.alghahim.co.ke
- **API Key:** RESEND_API_KEY (environment variable)

### Security

#### Row-Level Security (RLS)

All email tables have RLS enabled with policies restricting access to admin users:

```sql
-- Example RLS policy
CREATE POLICY "Admins can view email logs" ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );
```

#### Admin Verification

The email management page verifies:
1. User is authenticated
2. User's email ends with `@alghahim.co.ke`
3. User has admin role in the database

## Usage Guide

### Sending an Email

1. Navigate to **Admin Dashboard** → **Email Management**
2. Click the **Send Email** tab
3. Enter recipient email address
4. Enter email subject
5. Enter HTML content (or use preview to see formatted version)
6. Click **Send Email**
7. Confirmation message appears

### Viewing Email History

1. Navigate to **Admin Dashboard** → **Email Management**
2. Click the **Email History** tab
3. View all sent emails with statuses
4. Check error messages for failed emails

### HTML Content Tips

- Use standard HTML tags and inline styles
- Avoid external CSS links
- Test in preview before sending
- Use web-safe fonts
- Keep images base64 encoded or embedded

### Email Templates (Future Feature)

Email templates can be created for common communications:
- Account notifications
- Password resets
- Transaction confirmations
- KYC reminders
- System announcements

## Environment Variables

Required environment variables:

```bash
# Resend Configuration
RESEND_API_KEY=your_resend_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Error Handling

Common errors and solutions:

### "Unauthorized: Admin access required"
- User is not logged in with an @alghahim.co.ke email
- Contact system administrator

### "Invalid email address format"
- Recipient email is not in valid format
- Check email address for typos

### "Missing required fields"
- One of the required fields (to, subject, html) is empty
- Fill all required fields before sending

### "Failed to send email"
- Resend API error
- Check RESEND_API_KEY configuration
- Verify email address is valid

## Monitoring and Logs

### Email Logging

All sent emails are automatically logged in the `email_logs` table:
- Status tracking (pending, sent, failed)
- Error messages for troubleshooting
- Admin tracking (which admin sent the email)
- Timestamp for audit purposes

### Database Indexes

Indexes are created for performance:
- `idx_email_logs_created_at`: For recent email queries
- `idx_email_logs_status`: For filtering by status
- `idx_email_logs_recipient`: For finding emails by recipient
- `idx_email_logs_sent_by`: For filtering by admin user

## Future Enhancements

1. **Email Templates**: Pre-built templates for common emails
2. **Batch Sending**: Send emails to multiple recipients
3. **Scheduled Emails**: Schedule emails for future delivery
4. **Email Analytics**: Track opens, clicks, bounces
5. **Webhook Support**: Handle Resend webhooks for delivery updates
6. **Email Forwarding**: Receive emails at the domain
7. **IMAP Integration**: Access domain email inbox

## Support

For issues or questions about email management:
1. Check the error message in the UI
2. Review logs in the `email_logs` table
3. Contact the development team
4. Submit a support ticket through the admin panel
