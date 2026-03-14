import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface AuditLogData {
  userId?: string;
  adminId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "failure";
  errorMessage?: string;
}

export interface LoginLogData {
  userId: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  loginMethod?: string;
  success: boolean;
  failureReason?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

export interface AdminActivityData {
  adminId: string;
  email?: string;
  action: string;
  targetUserId?: string;
  targetEmail?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  impact?: "high" | "medium" | "low";
}

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function logAuditEvent(data: AuditLogData) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: data.userId,
      admin_id: data.adminId,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      description: data.description,
      changes: data.changes,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      status: data.status || "success",
      error_message: data.errorMessage,
    });

    if (error) {
      console.error("[v0] Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("[v0] Error logging audit event:", error);
  }
}

export async function logLoginEvent(data: LoginLogData) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from("login_logs").insert({
      user_id: data.userId,
      email: data.email,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      login_method: data.loginMethod || "password",
      success: data.success,
      failure_reason: data.failureReason,
      device_type: data.deviceType,
      browser: data.browser,
      os: data.os,
      country: data.country,
      city: data.city,
    });

    if (error) {
      console.error("[v0] Failed to log login event:", error);
    }
  } catch (error) {
    console.error("[v0] Error logging login event:", error);
  }
}

export async function logAdminActivity(data: AdminActivityData) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from("admin_activity_logs").insert({
      admin_id: data.adminId,
      email: data.email,
      action: data.action,
      target_user_id: data.targetUserId,
      target_email: data.targetEmail,
      details: data.details,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      impact: data.impact || "medium",
    });

    if (error) {
      console.error("[v0] Failed to log admin activity:", error);
    }
  } catch (error) {
    console.error("[v0] Error logging admin activity:", error);
  }
}

export async function logSecurityEvent(
  eventType: string,
  userId: string | undefined,
  description: string,
  severity: "low" | "medium" | "high" = "medium",
  ipAddress?: string
) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from("security_events").insert({
      user_id: userId,
      event_type: eventType,
      severity,
      description,
      ip_address: ipAddress,
    });

    if (error) {
      console.error("[v0] Failed to log security event:", error);
    }
  } catch (error) {
    console.error("[v0] Error logging security event:", error);
  }
}

export async function logEmailEvent(
  recipientEmail: string,
  senderEmail: string,
  subject: string,
  messageId?: string,
  forwardedToSuperAdmin = false
) {
  try {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from("email_audit").insert({
      recipient_email: recipientEmail,
      sender_email: senderEmail,
      subject,
      message_id: messageId,
      forwarded_to_super_admin: forwardedToSuperAdmin,
      forwarded_at: forwardedToSuperAdmin ? new Date().toISOString() : null,
      status: "received",
    });

    if (error) {
      console.error("[v0] Failed to log email event:", error);
    }
  } catch (error) {
    console.error("[v0] Error logging email event:", error);
  }
}
