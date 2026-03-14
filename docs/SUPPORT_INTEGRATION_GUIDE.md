# Customer Support Module - Integration Guide

## Quick Start

### Step 1: Database Setup
The support system tables have already been created. Verify they exist:

```bash
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'support_%';
```

Expected tables:
- `support_staff`
- `chat_sessions`
- `chat_messages`
- `voice_calls`
- `webrtc_signaling`
- `call_queue`
- `chat_queue`
- `support_activity_logs`
- `support_settings`

### Step 2: Environment Variables
Add support system variables to `.env.local`:

```bash
# Minimal Setup (uses Google STUN servers)
NEXT_PUBLIC_WS_SIGNALING_URL=wss://signaling.bank.alghahim.co.ke
WS_SIGNALING_SECURE=true

# Optional: TURN Server for better NAT traversal
NEXT_PUBLIC_TURN_URL=turn:turnserver.bank.alghahim.co.ke:3478
TURN_USERNAME=support_user
TURN_CREDENTIAL=secure_password
```

For development, you can use free Google STUN servers. For production, configure your own TURN server.

### Step 3: Add Support Widget to Customer Dashboard

In your customer dashboard page (`app/(dashboard)/dashboard/page.tsx`):

```tsx
import { FloatingChatWidget } from '@/components/support/floating-chat-widget'
import { useAuth } from '@/lib/auth-provider'

export default function Dashboard() {
  const { user, profile } = useAuth()

  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Add floating chat widget */}
      <FloatingChatWidget
        userId={user?.id}
        customerEmail={user?.email || ''}
        customerName={profile?.full_name || 'Customer'}
        onCallStart={(callId) => {
          console.log('Call started:', callId)
          // Handle call initiation if needed
        }}
      />
    </div>
  )
}
```

### Step 4: Add Support Admin Panel Link

In your admin dashboard sidebar/navigation (`app/(admin)/layout.tsx` or similar):

```tsx
<nav>
  {/* Existing nav items */}
  
  <Link href="/admin/support">
    <HeadsetIcon className="mr-2 h-4 w-4" />
    Support Management
  </Link>
</nav>
```

### Step 5: Add Support Staff Dashboard

In your staff/dashboard navigation:

```tsx
<Link href="/dashboard/support">
  <HeadsetIcon className="mr-2 h-4 w-4" />
  Support Queue
</Link>
```

## WebSocket Signaling Server Setup (Production)

### Option A: Self-Hosted (CoTURN + Custom Signaling)

1. **Deploy Node.js Signaling Server**

Create `/servers/signaling-server.js`:

```javascript
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const peers = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'join') {
      peers.set(message.peerId, ws);
      ws.peerId = message.peerId;
    }
    
    if (message.to && peers.has(message.to)) {
      peers.get(message.to).send(JSON.stringify(message));
    }
  });
  
  ws.on('close', () => {
    if (ws.peerId) {
      peers.delete(ws.peerId);
    }
  });
});

server.listen(3001, () => {
  console.log('Signaling server running on port 3001');
});
```

Deploy to your infrastructure (AWS EC2, DigitalOcean, etc.)

2. **Set Environment Variable**

```bash
NEXT_PUBLIC_WS_SIGNALING_URL=wss://signaling.bank.alghahim.co.ke
```

### Option B: Managed Service

Use Twilio TURN service:

```env
NEXT_PUBLIC_TURN_URL=turn:nats.twilio.com:443?transport=udp
TURN_USERNAME=your_twilio_account
TURN_CREDENTIAL=your_twilio_token
```

## Role Assignment & Permissions

### Add Support Staff Member

1. Go to Admin Dashboard → Support Management
2. Click "Add Support Staff"
3. Enter staff email, name, and role
4. System automatically creates staff record linked to user account

### Roles Hierarchy

```
Super Admin (bank.alghahim.co.ke)
├── Admin (bank.alghahim.co.ke)
│   └── Can add/remove staff, view all metrics
├── Supervisor
│   └── Can manage team, reassign chats/calls, view reports
├── Team Lead
│   └── Can monitor team, reassign within team
└── Support Agent
    └── Can handle chats/calls, pick from queue
```

## Real-Time Features Configuration

### Enable Auto-Assignment

In `lib/support-config.ts`:

```typescript
CHAT_CONFIG: {
  auto_assign_enabled: true,  // Enable auto-assignment
  max_concurrent_chats_per_agent: 5,
}
```

When auto-assign is enabled, chats are automatically assigned to the first available agent.

### Configure Queue Behavior

```typescript
CHAT_CONFIG: {
  queue_timeout_seconds: 300,  // 5 minutes before abandoned
}
```

Chats/calls are marked as abandoned if not answered within this time.

## Notifications Setup

### Email Notifications

The system sends notifications via Resend API (already integrated):

1. New chat assigned to staff
2. New call incoming
3. Chat escalated to supervisor
4. Call quality alerts

Update in `lib/support/notification-service.ts`:

```typescript
const NOTIFICATION_CONFIG = {
  notifyStaffOnNewChat: true,
  notifyAdminOnEscalation: true,
  notifyCustomerOnResolution: true,
  emailFrom: 'support@bank.alghahim.co.ke',
}
```

## Monitoring & Metrics

### View Dashboard Metrics

**Admin Dashboard** (`/admin/support`):
- Active chats/calls count
- Online staff count
- System health
- Staff performance breakdown

**Staff Dashboard** (`/dashboard/support`):
- Waiting chats queue
- My active chats
- Waiting calls queue
- My active calls

### Query Metrics Directly

```typescript
// Get chat statistics
const { data: chatStats } = await supabase
  .from('chat_sessions')
  .select('*')
  .eq('status', 'active')

// Get call statistics
const { data: callStats } = await supabase
  .from('voice_calls')
  .select('*')
  .eq('status', 'answered')

// Get staff utilization
const { data: staffUtil } = await supabase
  .from('support_staff')
  .select('staff_name, current_chat_count, current_call_count')
```

## Sensitive Data Handling

The system automatically masks sensitive information in chats:

- Account numbers: `****`
- PINs: `****`
- Card numbers: `****`
- SSNs: `****`

To customize masking patterns:

```typescript
// In lib/support-config.ts
SENSITIVE_PATTERNS: {
  account_number: /\b\d{10,20}\b/g,
  pin: /\b\d{4,6}\b/g,
  card_number: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  custom_pattern: /your_regex_here/g,
}
```

## Testing the Integration

### 1. Test Chat Flow

```bash
curl -X POST http://localhost:3000/api/support/chat/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "customerEmail": "customer@bank.alghahim.co.ke",
    "customerName": "John Doe"
  }'
```

### 2. Test Voice Call Flow

```bash
curl -X POST http://localhost:3000/api/support/call/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "customerEmail": "customer@bank.alghahim.co.ke",
    "customerName": "John Doe",
    "callType": "voice"
  }'
```

### 3. Check Database Records

```sql
SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM voice_calls ORDER BY created_at DESC LIMIT 5;
SELECT * FROM support_staff WHERE is_active = true;
```

## Subdomain Configuration

The support system works across all subdomains:

- **bank.alghahim.co.ke**: Floating widget (read-only access)
- **app.bank.alghahim.co.ke**: Full customer dashboard with support
- **admin.bank.alghahim.co.ke**: Admin support management

Cookies are scoped to `.bank.alghahim.co.ke` so sessions persist across all subdomains.

## Troubleshooting

### Chat not appearing in queue
1. Check `chat_queue` table has entries
2. Verify RLS policies allow staff to see unassigned chats
3. Check browser console for WebSocket errors

### Voice call WebRTC issues
1. Check microphone permissions in browser
2. Verify STUN/TURN server connectivity
3. Check ICE candidate gathering in browser DevTools
4. Ensure ports 3478-3479 open for TURN

### Staff not receiving notifications
1. Verify Resend API key configured
2. Check `support_activity_logs` for activity records
3. Verify staff email addresses are correct
4. Check email spam folder

### Auto-assignment not working
1. Verify `auto_assign_enabled: true` in config
2. Check staff availability status is "online"
3. Verify concurrent chat limit not exceeded
4. Check support activity logs for assignment events

## Performance Tuning

### Database Indexes
Indexes are automatically created on:
- `chat_sessions.user_id`
- `chat_sessions.assigned_staff_id`
- `voice_calls.status`
- `support_activity_logs.created_at`

### Query Optimization
```typescript
// ✅ Good: Indexed columns
const chats = await supabase
  .from('chat_sessions')
  .select('*')
  .eq('assigned_staff_id', staffId)  // Indexed
  .eq('status', 'active')             // Indexed

// ❌ Avoid: Unindexed columns
const chats = await supabase
  .from('chat_sessions')
  .select('*')
  .eq('customer_email', email)  // Not indexed
```

## Next Steps

1. Configure WebSocket signaling server
2. Set up TURN server (for production)
3. Add support widget to customer dashboard
4. Assign support staff in admin panel
5. Monitor dashboard metrics
6. Configure notification preferences
7. Set up monitoring/alerting

## Support & Maintenance

For issues or questions:
1. Check `/docs/SUPPORT_SYSTEM.md` for detailed documentation
2. Review browser console and server logs
3. Check Supabase dashboard for database issues
4. Verify all environment variables are set correctly
