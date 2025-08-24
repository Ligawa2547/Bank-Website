import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log("PayPal webhook received:", body.event_type)

    // Handle different webhook events
    switch (body.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        const saleId = body.resource.id
        const paymentId = body.resource.parent_payment

        console.log("Payment sale completed:", { saleId, paymentId })

        // Update transaction status if needed
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            metadata: { sale_id: saleId },
          })
          .eq("reference", paymentId)

        break

      case "PAYMENT.SALE.DENIED":
        const deniedPaymentId = body.resource.parent_payment

        console.log("Payment sale denied:", deniedPaymentId)

        await supabase.from("transactions").update({ status: "failed" }).eq("reference", deniedPaymentId)

        break

      case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
        const payoutItemId = body.resource.payout_item_id

        console.log("Payout succeeded:", payoutItemId)

        // Update withdrawal transaction status
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            metadata: { payout_item_id: payoutItemId },
          })
          .eq("reference", payoutItemId)

        break

      case "PAYMENT.PAYOUTS-ITEM.FAILED":
        const failedPayoutItemId = body.resource.payout_item_id

        console.log("Payout failed:", failedPayoutItemId)

        await supabase.from("transactions").update({ status: "failed" }).eq("reference", failedPayoutItemId)

        break

      default:
        console.log("Unhandled webhook event:", body.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
