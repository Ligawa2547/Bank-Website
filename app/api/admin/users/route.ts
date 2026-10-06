import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

function getServiceClient() {
  return createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function requireAdmin() {
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  return user?.email?.toLowerCase().endsWith("@iaenb.com") ? user : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  const { data, error } = await getServiceClient().from("user_profiles").select("user_id, account_no, account_number, email, first_name, last_name, phone, phone_number, balance, account_balance, status, account_status, kyc_status, created_at, updated_at").order("created_at", { ascending: false })
  if (error) {
    console.error("[Admin] Failed to fetch users", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
  return NextResponse.json({ users: (data ?? []).map((p) => ({ id: p.user_id, account_no: p.account_no ?? p.account_number ?? "", email: p.email ?? "", first_name: p.first_name ?? "", last_name: p.last_name ?? "", phone: p.phone ?? p.phone_number ?? "", account_balance: Number(p.balance ?? p.account_balance ?? 0), account_status: p.status ?? p.account_status ?? "pending", verification_status: p.kyc_status ?? "unverified", created_at: p.created_at, updated_at: p.updated_at })) })
}

export async function PATCH(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  const body = await request.json() as { userId?: string; field?: "verification_status" | "account_status"; value?: string }
  if (!body.userId || !body.field || !body.value) return NextResponse.json({ error: "Invalid update" }, { status: 400 })
  const update = body.field === "verification_status" ? { kyc_status: body.value, updated_at: new Date().toISOString() } : { status: body.value, updated_at: new Date().toISOString() }
  const { error } = await getServiceClient().from("user_profiles").update(update).eq("user_id", body.userId)
  if (error) return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
