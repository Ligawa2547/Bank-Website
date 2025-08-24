import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log("PayPal webhook received:", body.event_type)

    // Handle different PayPal webhook events
    switch (body.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        // Handle completed payment
        const paymentId = body.resource?.parent_payment
        if (paymentId) {
          await supabase.from("transactions").update({ status: "completed" }).eq("reference", paymentId)
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        // Handle failed/refunded payment
        const failedPaymentId = body.resource?.parent_payment
        if (failedPaymentId) {
          await supabase.from("transactions").update({ status: "failed" }).eq("reference", failedPaymentId)
        }
        break

      default:
        console.log("Unhandled webhook event:", body.event_type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
