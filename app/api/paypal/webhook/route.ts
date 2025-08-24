import { type NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("PayPal webhook received:", body)

    const supabase = createClientComponentClient()

    // Handle different webhook events
    switch (body.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        // Handle completed payment
        const paymentId = body.resource.parent_payment
        if (paymentId) {
          await supabase
            .from("transactions")
            .update({
              status: "completed",
              external_reference: body.resource.id,
            })
            .eq("reference", paymentId)
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        // Handle failed/refunded payment
        const failedPaymentId = body.resource.parent_payment
        if (failedPaymentId) {
          await supabase.from("transactions").update({ status: "failed" }).eq("reference", failedPaymentId)
        }
        break

      case "PAYOUTS.PAYOUT-ITEM.SUCCEEDED":
        // Handle successful payout
        const payoutBatchId = body.resource.payout_batch_id
        if (payoutBatchId) {
          await supabase
            .from("transactions")
            .update({
              status: "completed",
              external_reference: body.resource.payout_item_id,
            })
            .eq("reference", payoutBatchId)
        }
        break

      case "PAYOUTS.PAYOUT-ITEM.FAILED":
        // Handle failed payout
        const failedPayoutBatchId = body.resource.payout_batch_id
        if (failedPayoutBatchId) {
          await supabase.from("transactions").update({ status: "failed" }).eq("reference", failedPayoutBatchId)
        }
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
