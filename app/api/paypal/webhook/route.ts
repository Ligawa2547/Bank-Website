import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("=== PayPal Webhook Handler ===")

    const body = await request.json()
    console.log("PayPal webhook received:", {
      eventType: body.event_type,
      resourceType: body.resource_type,
      summary: body.summary,
    })

    const supabase = createRouteHandlerClient({ cookies })

    // Handle different webhook events
    switch (body.event_type) {
      case "PAYMENT.SALE.COMPLETED":
        console.log("Payment sale completed:", body.resource.id)

        // Update transaction status if needed
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            external_reference: body.resource.id,
            updated_at: new Date().toISOString(),
          })
          .eq("reference", body.resource.parent_payment)

        if (updateError) {
          console.error("Error updating transaction from webhook:", updateError)
        }
        break

      case "PAYMENT.SALE.DENIED":
        console.log("Payment sale denied:", body.resource.id)

        // Update transaction status to failed
        const { error: denyError } = await supabase
          .from("transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("reference", body.resource.parent_payment)

        if (denyError) {
          console.error("Error updating denied transaction:", denyError)
        }
        break

      case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
        console.log("Payout succeeded:", body.resource.payout_item_id)

        // Update payout transaction status
        const { error: payoutError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("external_reference", body.resource.payout_batch_id)

        if (payoutError) {
          console.error("Error updating payout transaction:", payoutError)
        }
        break

      case "PAYMENT.PAYOUTS-ITEM.FAILED":
        console.log("Payout failed:", body.resource.payout_item_id)

        // Update payout transaction status to failed
        const { error: payoutFailError } = await supabase
          .from("transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("external_reference", body.resource.payout_batch_id)

        if (payoutFailError) {
          console.error("Error updating failed payout transaction:", payoutFailError)
        }
        break

      default:
        console.log("Unhandled webhook event:", body.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("PayPal webhook handler error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
