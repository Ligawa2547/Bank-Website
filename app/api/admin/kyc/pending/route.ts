import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function GET() {
  const supabase = getServiceClient()
  const { data: events, error } = await supabase
    .from("didit_webhook_events")
    .select("event_id, session_id, vendor_data, status, payload, received_at")
    .in("status", ["In Review", "Resubmitted"])
    .order("received_at", { ascending: false })

  if (error) {
    console.error("[KYC] Failed to load Didit events", error)
    return NextResponse.json({ error: "Failed to load KYC applications" }, { status: 500 })
  }

  const userIds = [...new Set((events ?? []).map((event) => event.vendor_data).filter(Boolean))]
  const { data: profiles, error: profileError } = userIds.length
    ? await supabase
        .from("user_profiles")
        .select("user_id, account_no, account_number, first_name, last_name, email, phone_number")
        .in("user_id", userIds)
    : { data: [], error: null }

  if (profileError) {
    console.error("[KYC] Failed to load applicant profiles", profileError)
    return NextResponse.json({ error: "Failed to load applicant profiles" }, { status: 500 })
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]))
  const submissions = (events ?? []).map((event) => {
    const profile = profileMap.get(event.vendor_data)
    const payload = (event.payload ?? {}) as Record<string, unknown>
    return {
      id: event.event_id,
      account_no: profile?.account_no ?? profile?.account_number ?? "N/A",
      document_type: String(payload.document_type ?? payload.id_document_type ?? "Didit identity verification"),
      document_number: String(payload.document_number ?? payload.id_number ?? "Managed by Didit"),
      document_front_url: String(payload.document_front_url ?? payload.id_document_front ?? ""),
      document_back_url: String(payload.document_back_url ?? payload.id_document_back ?? ""),
      selfie_url: String(payload.selfie_url ?? payload.face_match_image ?? ""),
      status: "pending",
      submitted_at: event.received_at,
      session_id: event.session_id,
      user: {
        account_no: profile?.account_no ?? profile?.account_number ?? "N/A",
        first_name: profile?.first_name ?? "Unknown",
        last_name: profile?.last_name ?? "User",
        email: profile?.email ?? "N/A",
        phone: profile?.phone_number ?? "N/A",
        date_of_birth: "",
      },
    }
  })

  return NextResponse.json({ submissions })
}
