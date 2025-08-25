import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 PayPal webhook received")

    const body = await request.json()
    const eventType = body.event_type
    const resource = body.resource

    console.log(`📨 Webhook event: ${eventType}`)

    // Handle different webhook events
    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED":
        console.log("✅ Order approved:", resource.id)
        break

      case "CHECKOUT.ORDER.COMPLETED":
        console.log("✅ Order completed:", resource.id)
        // Additional processing if needed
        break

      case "PAYMENT.CAPTURE.COMPLETED":
        console.log("💰 Payment captured:", resource.id)
        // Update transaction status if needed
        break

      case "PAYMENT.CAPTURE.DENIED":
        console.log("❌ Payment denied:", resource.id)
        // Handle denied payment
        break

      default:
        console.log(`ℹ️ Unhandled webhook event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
