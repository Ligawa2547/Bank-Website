import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    console.log("PayPal webhook received:", body.event_type, body.resource?.id)

    const eventType = body.event_type
    const resource = body.resource

    switch (eventType) {
      case "PAYMENT.SALE.COMPLETED":
        // Handle completed payment (deposit)
        if (resource?.parent_payment) {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.parent_payment)
            .eq("status", "pending")

          if (error) {
            console.error("Error updating completed payment:", error)
          } else {
            console.log("Payment marked as completed:", resource.parent_payment)
          }
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        // Handle failed/refunded payment
        if (resource?.parent_payment) {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.parent_payment)

          if (error) {
            console.error("Error updating failed payment:", error)
          } else {
            console.log("Payment marked as failed:", resource.parent_payment)
          }
        }
        break

      case "PAYOUTS.PAYOUT-ITEM.SUCCEEDED":
        // Handle successful payout (withdrawal)
        console.log("Payout succeeded:", resource?.payout_item_id)
        break

      case "PAYOUTS.PAYOUT-ITEM.FAILED":
        // Handle failed payout - refund user balance
        if (resource?.payout_batch_id) {
          const { data: transaction } = await supabase
            .from("transactions")
            .select("user_id, amount")
            .eq("reference", resource.payout_batch_id)
            .eq("transaction_type", "withdrawal")
            .single()

          if (transaction) {
            // Refund the user's balance
            const { data: userData } = await supabase
              .from("users")
              .select("account_balance")
              .eq("id", transaction.user_id)
              .single()

            if (userData) {
              const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
              const refundedBalance = currentBalance + transaction.amount

              await supabase
                .from("users")
                .update({
                  account_balance: refundedBalance,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", transaction.user_id)

              // Update transaction status
              await supabase
                .from("transactions")
                .update({
                  status: "failed",
                  updated_at: new Date().toISOString(),
                })
                .eq("reference", resource.payout_batch_id)

              console.log("Payout failed, balance refunded:", transaction.user_id)
            }
          }
        }
        break

      default:
        console.log("Unhandled webhook event:", eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
