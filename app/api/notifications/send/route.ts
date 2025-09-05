import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { sendNotificationWithEmail } from "@/lib/notifications/handler"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { accountNo, title, message, type, additionalData } = body

    if (!accountNo || !title || !message) {
      return NextResponse.json({ error: "Missing required fields: accountNo, title, message" }, { status: 400 })
    }

    const result = await sendNotificationWithEmail(accountNo, title, message, type, additionalData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in notification API:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
