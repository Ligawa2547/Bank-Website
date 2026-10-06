import crypto from "node:crypto"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

function shortenFloats(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shortenFloats)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, shortenFloats(item)]),
    )
  }
  if (typeof value === "number" && !Number.isInteger(value) && value % 1 === 0) return Math.trunc(value)
  return value
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortKeys((value as Record<string, unknown>)[key])
        return result
      }, {})
  }
  return value
}

function signaturesMatch(expected: string, received: string) {
  const normalized = received.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) return false
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(normalized, "hex"))
}

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: Request) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET
  if (!secret) return new NextResponse("Webhook is not configured", { status: 503 })

  const rawBody = await request.text()
  const signature = request.headers.get("x-signature-v2") ?? ""
  const timestamp = Number(request.headers.get("x-timestamp"))

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return new NextResponse("stale", { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid payload")
    payload = parsed as Record<string, unknown>
  } catch {
    return new NextResponse("invalid payload", { status: 400 })
  }

  const canonical = JSON.stringify(sortKeys(shortenFloats(payload)))
  const expected = crypto.createHmac("sha256", secret).update(canonical, "utf8").digest("hex")
  if (!signaturesMatch(expected, signature)) return new NextResponse("bad sig", { status: 401 })

  const eventId = typeof payload.event_id === "string" ? payload.event_id : ""
  const vendorData = typeof payload.vendor_data === "string" ? payload.vendor_data : ""
  const sessionId = typeof payload.session_id === "string" ? payload.session_id : null
  const status = typeof payload.status === "string" ? payload.status : ""

  if (!eventId || !vendorData || !status) return new NextResponse("invalid event", { status: 400 })

  const supabase = getServiceClient()
  const { error: eventError } = await supabase.from("didit_webhook_events").insert({
    event_id: eventId,
    session_id: sessionId,
    vendor_data: vendorData,
    status,
    payload,
  })

  if (eventError?.code === "23505") return new NextResponse("ok")
  if (eventError) {
    console.error("[KYC] Failed to record Didit webhook", eventError)
    return new NextResponse("temporary failure", { status: 500 })
  }

  const kycStatus =
    status === "Approved"
      ? "approved"
      : status === "Declined"
        ? "declined"
        : status === "In Review" || status === "Resubmitted"
          ? "pending"
          : status === "Kyc Expired" || status === "Expired"
            ? "expired"
            : null

  if (kycStatus) {
    const { error: updateError } = await supabase.from("users").update({ kyc_status: kycStatus }).eq("id", vendorData)
    if (updateError) {
      console.error("[KYC] Failed to update user status", updateError)
      return new NextResponse("temporary failure", { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "didit-webhook" })
}
