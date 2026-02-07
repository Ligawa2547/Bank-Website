-- Create audit_logs table for comprehensive system activity tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  admin_id UUID,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  description TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create login_logs table for tracking user authentication
CREATE TABLE IF NOT EXISTS login_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  login_method VARCHAR(50) DEFAULT 'password',
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  device_type VARCHAR(100),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create admin_activity_logs table for admin-specific actions
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL,
  email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  target_user_id UUID,
  target_email VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  impact VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create security_events table for suspicious activities
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium',
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create email_audit table for super admin email tracking
CREATE TABLE IF NOT EXISTS email_audit (
  id BIGSERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT,
  message_id VARCHAR(255),
  forwarded_to_super_admin BOOLEAN DEFAULT FALSE,
  forwarded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'received',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);

CREATE INDEX IF NOT EXISTS idx_admin_activity_timestamp ON admin_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

CREATE INDEX IF NOT EXISTS idx_email_audit_recipient ON email_audit(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_audit_timestamp ON email_audit(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_email_audit_forwarded ON email_audit(forwarded_to_super_admin);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.role = 'super_admin'));

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Anyone can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for login_logs
CREATE POLICY "Super admins can view all login logs"
  ON login_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.role = 'super_admin'));

CREATE POLICY "Admins can view login logs"
  ON login_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Anyone can insert login logs"
  ON login_logs FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for admin_activity_logs
CREATE POLICY "Super admins can view all admin activity"
  ON admin_activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.role = 'super_admin'));

CREATE POLICY "Admins can view admin activity"
  ON admin_activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "Admins can insert admin activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- RLS Policies for security_events
CREATE POLICY "Super admins can manage security events"
  ON security_events FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.role = 'super_admin'));

CREATE POLICY "Admins can view security events"
  ON security_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policies for email_audit
CREATE POLICY "Super admins can view all email audit"
  ON email_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid() AND admins.role = 'super_admin'));

CREATE POLICY "Admins can view email audit"
  ON email_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

CREATE POLICY "System can insert email audit"
  ON email_audit FOR INSERT
  WITH CHECK (TRUE);
