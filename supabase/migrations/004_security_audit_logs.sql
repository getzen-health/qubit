-- Security & Audit Logging Tables
-- Migration: 004_security_audit_logs.sql
-- HIPAA-compliant audit trail for health data access

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Can be 'anonymous' for failed logins
    action TEXT NOT NULL CHECK (action IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT',
        'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PERMISSION_DENIED'
    )),
    resource_type TEXT NOT NULL CHECK (resource_type IN (
        'meal', 'water_log', 'fasting_session', 'health_data',
        'user_profile', 'nutrition_settings', 'daily_summary', 'auth'
    )),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);

-- Partition by month for better performance (optional - requires Postgres 11+)
-- Consider implementing if logs grow large

-- ============================================
-- SECURITY EVENTS TABLE (for threat detection)
-- ============================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'brute_force_attempt',
        'rate_limit_exceeded',
        'invalid_token',
        'suspicious_activity',
        'unauthorized_access',
        'data_exfiltration_attempt',
        'sql_injection_attempt',
        'xss_attempt'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id TEXT,
    ip_address INET NOT NULL,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(resolved, created_at DESC) WHERE NOT resolved;

-- ============================================
-- USER SESSIONS TABLE (enhanced session tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL, -- Store hash, not actual token
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, revoked, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token_hash) WHERE NOT revoked;
CREATE INDEX IF NOT EXISTS idx_user_sessions_cleanup ON user_sessions(expires_at) WHERE NOT revoked;

-- ============================================
-- DATA ACCESS CONSENT TABLE (GDPR/HIPAA compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS data_access_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'health_data_collection',
        'health_data_sharing',
        'analytics',
        'marketing',
        'third_party_integration'
    )),
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    consent_text_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, consent_type)
);

-- Index for consent checks
CREATE INDEX IF NOT EXISTS idx_data_consents_user ON data_access_consents(user_id, consent_type, granted);

-- ============================================
-- ENCRYPTION KEYS TABLE (for field-level encryption)
-- ============================================
CREATE TABLE IF NOT EXISTS user_encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    key_encrypted TEXT NOT NULL, -- Key encrypted with master key
    key_version INTEGER NOT NULL DEFAULT 1,
    algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Audit logs - read only for the user, write via service role
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid()::text);

-- Security events - admin only (service role)
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- No user-facing policies - accessed via service role only

-- User sessions - users can see their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can revoke their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Data access consents - users manage their own
ALTER TABLE data_access_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consents" ON data_access_consents
    FOR ALL USING (user_id = auth.uid());

-- Encryption keys - users access their own (but can't read the key directly)
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own encryption key metadata" ON user_encryption_keys
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS FOR SECURITY OPERATIONS
-- ============================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW() OR (revoked = TRUE AND revoked_at < NOW() - INTERVAL '30 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect brute force attempts
CREATE OR REPLACE FUNCTION check_brute_force(check_ip INET, check_minutes INTEGER DEFAULT 15, max_attempts INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM audit_logs
    WHERE ip_address = check_ip
      AND action = 'FAILED_LOGIN'
      AND created_at > NOW() - (check_minutes || ' minutes')::INTERVAL;

    RETURN attempt_count >= max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_ip_address INET,
    p_user_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_request_method TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type, severity, ip_address, user_id, user_agent,
        request_path, request_method, details
    ) VALUES (
        p_event_type, p_severity, p_ip_address, p_user_id, p_user_agent,
        p_request_path, p_request_method, p_details
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOG RETENTION POLICY
-- Keep audit logs for 7 years (HIPAA requirement)
-- Implement via scheduled job or trigger
-- ============================================

-- Create a view for recent security alerts (for admin dashboard)
CREATE OR REPLACE VIEW recent_security_alerts AS
SELECT
    id,
    event_type,
    severity,
    ip_address,
    created_at,
    resolved
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    created_at DESC;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit trail for all health data access';
COMMENT ON TABLE security_events IS 'Security incident tracking for threat detection';
COMMENT ON TABLE user_sessions IS 'Enhanced session tracking with device info';
COMMENT ON TABLE data_access_consents IS 'GDPR/HIPAA consent tracking';
COMMENT ON TABLE user_encryption_keys IS 'Per-user encryption keys for field-level encryption';
