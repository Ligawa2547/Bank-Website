import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DIDIT_SESSION_URL = "https://verification.didit.me/v3/session/"
const DIDIT_WORKFLOW_ID = "6096ba6d-3cca-4cc0-b539-af9796d75b5e"

export async function POST() {
  const apiKey = process.env.DIDIT_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "KYC verification is not configured" }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to start verification" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, account_number, kyc_status")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: "Your account profile could not be found" }, { status: 404 })
  }

  if (profile.kyc_status === "approved") {
    return NextResponse.json({ error: "Your identity is already verified" }, { status: 409 })
  }

  const response = await fetch(DIDIT_SESSION_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: user.id,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    console.error("[KYC] Didit session creation failed", response.status)
    return NextResponse.json({ error: "Unable to start identity verification" }, { status: 502 })
  }

  const session = (await response.json()) as { url?: string; session_id?: string; session_token?: string }
  const verificationUrl = session.url

  if (!verificationUrl) {
    console.error("[KYC] Didit response did not include a verification URL")
    return NextResponse.json({ error: "Identity verification is temporarily unavailable" }, { status: 502 })
  }

  return NextResponse.json({ url: verificationUrl, sessionId: session.session_id })
}
