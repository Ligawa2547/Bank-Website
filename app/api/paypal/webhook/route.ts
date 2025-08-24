import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const webhookData = await request.json()

    console.log("PayPal webhook received:", webhookData.event_type)

    const eventType = webhookData.event_type
    const resource = webhookData.resource

    switch (eventType) {
      case "PAYMENT.SALE.COMPLETED":
        // Handle completed payment
        if (resource.parent_payment) {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.parent_payment)

          if (error) {
            console.error("Error updating completed payment:", error)
          }
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        // Handle failed/refunded payment
        if (resource.parent_payment) {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.parent_payment)

          if (error) {
            console.error("Error updating failed payment:", error)
          }
        }
        break

      case "PAYOUTS.PAYOUT-ITEM.SUCCEEDED":
        // Handle successful payout
        if (resource.payout_batch_id) {
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.payout_batch_id)

          if (error) {
            console.error("Error updating successful payout:", error)
          }
        }
        break

      case "PAYOUTS.PAYOUT-ITEM.FAILED":
      case "PAYOUTS.PAYOUT-ITEM.RETURNED":
        // Handle failed payout - refund the user's balance
        if (resource.payout_batch_id) {
          const { data: transaction, error: transactionError } = await supabase
            .from("transactions")
            .select("user_id, amount")
            .eq("reference", resource.payout_batch_id)
            .single()

          if (!transactionError && transaction) {
            // Refund the user's balance
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("account_balance")
              .eq("id", transaction.user_id)
              .single()

            if (!userError && userData) {
              const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
              const refundedBalance = currentBalance + transaction.amount

              await supabase
                .from("users")
                .update({
                  account_balance: refundedBalance,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", transaction.user_id)
            }
          }

          // Update transaction status
          const { error } = await supabase
            .from("transactions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("reference", resource.payout_batch_id)

          if (error) {
            console.error("Error updating failed payout:", error)
          }
        }
        break

      default:
        console.log("Unhandled webhook event:", eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
