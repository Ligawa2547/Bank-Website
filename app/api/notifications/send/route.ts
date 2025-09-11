import { type NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications/handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, sendEmail, metadata } = body

    // Validate required fields
    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields: userId, title, message" }, { status: 400 })
    }

    // Validate type
    const validTypes = ["info", "success", "warning", "error"]
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notification type. Must be one of: info, success, warning, error" },
        { status: 400 },
      )
    }

    console.log("📨 Creating notification:", { userId, title, type, sendEmail })

    const result = await createNotification({
      userId,
      title,
      message,
      type: type || "info",
      sendEmail: sendEmail !== false, // Default to true unless explicitly false
      metadata,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create notification" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    console.error("❌ Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    const { getUserNotifications } = await import("@/lib/notifications/handler")
    const result = await getUserNotifications(userId, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("❌ Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
