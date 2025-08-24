import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    console.log("🔔 PayPal webhook received:", payload.event_type)

    const supabase = createRouteHandlerClient({ cookies })

    // Handle different webhook events
    switch (payload.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
        console.log("✅ PayPal order approved:", payload.resource.id)
        break

      case "PAYMENT.CAPTURE.COMPLETED":
        const captureId = payload.resource.id
        const orderId = payload.resource.supplementary_data?.related_ids?.order_id

        console.log("💰 PayPal capture completed:", { captureId, orderId })

        if (orderId) {
          await supabase
            .from("transactions")
            .update({
              status: "completed",
              metadata: {
                webhook_capture_id: captureId,
                webhook_received_at: new Date().toISOString(),
              },
            })
            .eq("reference", orderId)
        }
        break

      case "PAYMENT.CAPTURE.DENIED":
        console.log("❌ PayPal capture denied:", payload.resource.id)
        break

      default:
        console.log("ℹ️ Unhandled PayPal webhook event:", payload.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
