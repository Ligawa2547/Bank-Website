# Customer Support Module Documentation

## Overview

The Customer Support Module provides a complete real-time communication system for the banking platform, enabling customers to connect with support staff via chat and voice calls with WebRTC peer-to-peer audio.

## Features

### 1. Real-Time Chat System
- **WebSocket-based messaging**: Low-latency text chat using Supabase Realtime
- **Message History**: Complete chat history stored in database
- **Automatic Assignment**: Chats automatically assigned to available staff
- **Sensitive Data Masking**: Account numbers, PINs, card numbers automatically masked
- **File Sharing**: Support for file attachments in chat
- **Chat Transfer**: Admin can reassign chats to different staff members

### 2. Browser Voice Calls
- **Pure WebRTC Implementation**: Peer-to-peer audio for zero-latency calls
- **STUN/TURN Support**: Full NAT/firewall traversal for global connectivity
- **Call Queue**: Waiting calls displayed in order
- **Auto-Answer Available**: Agents can accept waiting calls
- **Call Recording**: Optional call recording for quality assurance
- **Call Duration Tracking**: Automatic duration measurement and logging

### 3. Role-Based Access Control

#### Customer Role
- Can start text chats
- Can initiate voice calls
- Can view their own chat history
- Can rate completed conversations
- Can provide feedback on service quality

#### Support Staff Role
- Can view assigned chats and calls
- Can pick up unassigned chats from queue
- Can answer incoming calls
- Can transfer chats/calls to other staff
- Can access customer information (masked sensitive data)
- Can see chat history

#### Team Lead Role
- All support staff permissions
- Can monitor team performance
- Can reassign chats/calls
- Can manage break times
- Can generate reports

#### Supervisor Role
- All team lead permissions
- Can manage support staff
- Can set availability schedules
- Can access detailed analytics
- Can configure system settings

#### Admin Role
- Full system access
- Can add/remove/edit support staff
- Can view all chats and calls
- Can monitor performance metrics
- Can configure system settings
- Can access audit logs

#### Super Admin Role
- Complete system control
- Can manage all aspects of support system
- Can configure STUN/TURN servers
- Can access all logs and analytics

## Architecture

### Database Schema

#### support_staff
Stores support agent information including name, email, role, availability status, and concurrent chat/call limits.

#### chat_sessions
Records all chat sessions with customer, assignment, status, and ratings.

#### chat_messages
Individual chat messages with sender type, content, read status, and timestamps.

#### voice_calls
Voice call records including duration, quality score, recording URL, and participant info.

#### webrtc_signaling
Stores WebRTC SDP offers/answers and ICE candidates for call negotiation.

#### call_queue
Tracks queued calls with position and wait times.

#### chat_queue
Tracks queued chats with position and wait times.

#### support_activity_logs
Audit trail for all support system activities.

## WebRTC Signaling Flow

1. **Customer Initiates Call**
   - `createVoiceCall()` creates call record in database
   - Call added to queue
   - Staff dashboard updated with new incoming call

2. **Staff Picks Up Call**
   - `assignCall()` assigns staff to call
   - Call status changes from "queued" to "ringing"
   - WebSocket notification sent to customer

3. **WebRTC Peer Connection**
   - Customer browser sends SDP offer via WebSocket signaling server
   - Staff browser receives offer and sends SDP answer
   - ICE candidates exchanged for NAT traversal
   - Peer connection established
   - Audio stream flows directly (P2P, not through server)

4. **Call Active**
   - Duration tracked in real-time
   - Audio quality monitored
   - Either party can end the call

5. **Call Completion**
   - `endCall()` records final duration and quality metrics
   - Call status changes to "completed"
   - Activity logged for audit trail

## API Routes

### Chat Endpoints

#### POST `/api/support/chat/start`
Creates a new chat session.
```json
{
  "userId": "string",
  "customerEmail": "string",
  "customerName": "string"
}
```

#### POST `/api/support/chat/message`
Sends a message in a chat session.
```json
{
  "sessionId": "string",
  "message": "string",
  "messageType": "text|file|image"
}
```

#### GET `/api/support/chat/:sessionId/messages`
Retrieves chat message history.

#### POST `/api/support/chat/:sessionId/assign`
Assigns a chat to a staff member.

#### POST `/api/support/chat/:sessionId/close`
Closes a chat session with optional rating.

### Call Endpoints

#### POST `/api/support/call/start`
Creates a new voice call.

#### POST `/api/support/call/:callId/answer`
Staff member answers an incoming call.

#### POST `/api/support/call/:callId/end`
Ends an active call with duration and quality data.

#### GET `/api/support/call/queue`
Gets current call queue.

### Admin Endpoints

#### GET `/api/admin/support/stats`
Gets support system statistics.

#### GET `/api/admin/support/staff`
Lists all support staff.

#### POST `/api/admin/support/staff`
Adds a new support staff member.

#### PUT `/api/admin/support/staff/:staffId`
Updates staff member information.

#### DELETE `/api/admin/support/staff/:staffId`
Removes a support staff member.

## Integration with Existing System

### Authentication
- Uses existing bank system authentication
- Cookies scoped to `.bank.alghahim.co.ke`
- Session persists across subdomains (bank.alghahim.co.ke, app.bank.alghahim.co.ke, admin.bank.alghahim.co.ke)

### User Roles
- Leverages existing role system from bank database
- Support staff created as separate records linked to auth.users
- Role-based access enforced via RLS policies

### Notifications
- Email notifications via Resend API
- In-app toast notifications for real-time feedback
- Optional email alerts for support team

## Installation & Setup

### 1. Database Migration
```bash
psql -U postgres -d your_db -f scripts/setup-support-system.sql
```

### 2. Environment Variables
Copy `.env.support.example` to `.env.local` and configure:
```bash
cp .env.support.example .env.local
```

### 3. WebSocket Signaling Server Setup
Deploy WebSocket signaling server (separate Node.js application):
```bash
npm install ws cors dotenv
node signaling-server.js
```

### 4. TURN Server Configuration
For production, set up your own TURN server or use a service:
- CoTURN (self-hosted): Recommended for banking applications
- Twilio TURN: Managed service
- AWS AppConfig with STUN/TURN

### 5. Enable Support Widget
Add to customer dashboard:
```tsx
import { FloatingChatWidget } from '@/components/support/floating-chat-widget'

<FloatingChatWidget 
  userId={user.id}
  customerEmail={user.email}
  customerName={user.name}
/>
```

## Security Considerations

### Data Protection
- All chat and call data encrypted in transit (TLS 1.3)
- Sensitive data automatically masked in chat
- Audio streams use DTLS-SRTP encryption
- Database records encrypted at rest

### Access Control
- Row-level security (RLS) enforces data isolation
- Role-based access control via JWT claims
- Admin actions logged for audit trail
- Session timeout enforced

### Privacy
- Call recordings encrypted
- Chat history accessible only to participants
- Audit logs restricted to admins
- GDPR-compliant data retention policies

## Performance Optimization

### Chat Performance
- Messages indexed on session_id and created_at
- Chat queue optimized for large numbers
- Real-time subscriptions scoped to active sessions
- Message pagination implemented

### Call Performance
- WebRTC peer connections directly between browsers
- Minimal server load (signaling only)
- Call quality metrics monitored
- Automatic bitrate adaptation

### Scalability
- Stateless design for horizontal scaling
- Call queue distributed across multiple servers
- WebSocket connections load-balanced
- Database connection pooling configured

## Monitoring & Analytics

### Metrics Tracked
- Total chats/calls (daily, weekly, monthly)
- Average chat/call duration
- Customer satisfaction ratings
- Staff utilization rates
- Call quality scores
- Queue wait times
- System response times

### Dashboards
- **Customer Dashboard**: View support tickets and chat history
- **Staff Dashboard**: Queue management and call handling
- **Admin Dashboard**: Team performance and system metrics
- **Analytics Dashboard**: Detailed reports and trends

## Troubleshooting

### Common Issues

#### Chat Messages Not Appearing
1. Check WebSocket connection status
2. Verify RLS policies allow access
3. Check browser console for errors
4. Ensure session ID is valid

#### Voice Call Issues
1. Check browser audio permissions
2. Verify microphone/speaker working
3. Check network connectivity (NAT issues)
4. Verify STUN/TURN server connectivity
5. Check ICE candidate gathering

#### Queue Issues
1. Verify chat_queue/call_queue tables populated
2. Check staff availability status
3. Verify assignment logic working
4. Check timeout values

## Performance Benchmarks

- Chat message latency: < 100ms
- Call setup time: 1-3 seconds
- Audio quality: 16kHz @ 20ms (VoIP standard)
- Maximum concurrent chats per agent: 5
- Maximum concurrent calls per agent: 2
- Queue handling: 100+ customers simultaneously

## Future Enhancements

- Video call support with WebRTC
- AI-powered chat responses
- Sentiment analysis for chats
- Predictive queue management
- Integration with CRM systems
- SMS support channel
- Social media integration
