-- Support System Database Schema

-- Create support_staff table
CREATE TABLE IF NOT EXISTS support_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT NOT NULL,
  phone TEXT,
  role VARCHAR(50) DEFAULT 'support' CHECK (role IN ('support', 'team_lead', 'supervisor')),
  is_active BOOLEAN DEFAULT TRUE,
  availability_status VARCHAR(50) DEFAULT 'offline' CHECK (availability_status IN ('offline', 'online', 'on_call', 'break')),
  current_chat_count INT DEFAULT 0,
  max_concurrent_chats INT DEFAULT 5,
  current_call_count INT DEFAULT 0,
  max_concurrent_calls INT DEFAULT 2,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  assigned_staff_id UUID,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed', 'transferred')),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  rating_comment TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE,
  transferred_from_staff_id UUID,
  transfer_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_staff_id) REFERENCES support_staff(id) ON DELETE SET NULL,
  FOREIGN KEY (transferred_from_staff_id) REFERENCES support_staff(id) ON DELETE SET NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'staff', 'system')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create voice_calls table
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  assigned_staff_id UUID,
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'answered', 'completed', 'failed', 'missed', 'declined')),
  call_type VARCHAR(50) DEFAULT 'voice' CHECK (call_type IN ('voice', 'video')),
  duration_seconds INT,
  started_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  recording_url TEXT,
  quality_score INT CHECK (quality_score >= 1 AND quality_score <= 100),
  transferred_from_staff_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_staff_id) REFERENCES support_staff(id) ON DELETE SET NULL,
  FOREIGN KEY (transferred_from_staff_id) REFERENCES support_staff(id) ON DELETE SET NULL
);

-- Create webrtc_signaling table for tracking peer connections
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL,
  initiator_id UUID NOT NULL,
  peer_id UUID NOT NULL,
  sdp_offer TEXT,
  sdp_answer TEXT,
  ice_candidates JSONB DEFAULT '[]'::jsonb,
  connection_state VARCHAR(50) DEFAULT 'new' CHECK (connection_state IN ('new', 'connecting', 'connected', 'disconnected', 'failed', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES voice_calls(id) ON DELETE CASCADE
);

-- Create call_queue table for managing unassigned calls
CREATE TABLE IF NOT EXISTS call_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL UNIQUE,
  position INT NOT NULL,
  wait_time_seconds INT DEFAULT 0,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (call_id) REFERENCES voice_calls(id) ON DELETE CASCADE
);

-- Create chat_queue table for managing unassigned chats
CREATE TABLE IF NOT EXISTS chat_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  position INT NOT NULL,
  wait_time_seconds INT DEFAULT 0,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Create support_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS support_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  staff_id UUID,
  user_id UUID,
  activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN ('login', 'logout', 'chat_started', 'chat_ended', 'call_started', 'call_ended', 'chat_transferred', 'call_transferred', 'status_changed', 'rating_given')),
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES support_staff(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create support_settings table
CREATE TABLE IF NOT EXISTS support_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create Indexes for performance
CREATE INDEX idx_support_staff_user_id ON support_staff(user_id);
CREATE INDEX idx_support_staff_is_active ON support_staff(is_active);
CREATE INDEX idx_support_staff_availability ON support_staff(availability_status);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_staff_id ON chat_sessions(assigned_staff_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX idx_voice_calls_user_id ON voice_calls(user_id);
CREATE INDEX idx_voice_calls_staff_id ON voice_calls(assigned_staff_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_created_at ON voice_calls(created_at DESC);
CREATE INDEX idx_webrtc_signaling_call_id ON webrtc_signaling(call_id);
CREATE INDEX idx_call_queue_position ON call_queue(position);
CREATE INDEX idx_chat_queue_position ON chat_queue(position);
CREATE INDEX idx_support_activity_logs_staff_id ON support_activity_logs(staff_id);
CREATE INDEX idx_support_activity_logs_created_at ON support_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_staff
CREATE POLICY "Support staff can view their own profile" ON support_staff
  FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Support staff can view all staff (for assignment)" ON support_staff
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY "Admin can manage support staff" ON support_staff
  FOR ALL USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

-- RLS Policies for chat_sessions
CREATE POLICY "Customers can view their own chats" ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Support staff can view assigned chats" ON chat_sessions
  FOR SELECT USING (assigned_staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all chats" ON chat_sessions
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY "Customers can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Support staff can update assigned chats" ON chat_sessions
  FOR UPDATE USING (assigned_staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view chat messages" ON chat_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid() 
      OR assigned_staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid())
    )
    OR auth.jwt() ->> 'role' IN ('super_admin', 'admin')
  );

CREATE POLICY "Users can insert messages in their chats" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
      OR assigned_staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for voice_calls
CREATE POLICY "Customers can view their own calls" ON voice_calls
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Support staff can view assigned calls" ON voice_calls
  FOR SELECT USING (assigned_staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all calls" ON voice_calls
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY "Customers can create voice calls" ON voice_calls
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for webrtc_signaling
CREATE POLICY "Call participants can view signaling data" ON webrtc_signaling
  FOR SELECT USING (
    initiator_id = auth.uid() OR peer_id = auth.uid() OR
    auth.jwt() ->> 'role' IN ('super_admin', 'admin')
  );

CREATE POLICY "Call participants can manage signaling" ON webrtc_signaling
  FOR ALL USING (initiator_id = auth.uid() OR peer_id = auth.uid());

-- RLS Policies for queues
CREATE POLICY "Support staff can view queues" ON call_queue
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin') OR 
    EXISTS (SELECT 1 FROM support_staff WHERE user_id = auth.uid() AND is_active = TRUE));

CREATE POLICY "System can manage queues" ON chat_queue
  FOR ALL USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

-- RLS Policies for support_activity_logs
CREATE POLICY "Staff can view their own activity" ON support_activity_logs
  FOR SELECT USING (staff_id IN (SELECT id FROM support_staff WHERE user_id = auth.uid()));

CREATE POLICY "Admin can view all activity" ON support_activity_logs
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY "System can insert activity logs" ON support_activity_logs
  FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for support_settings
CREATE POLICY "Admin can manage settings" ON support_settings
  FOR ALL USING (auth.jwt() ->> 'role' IN ('super_admin', 'admin'));

CREATE POLICY "Everyone can view settings" ON support_settings
  FOR SELECT USING (TRUE);
