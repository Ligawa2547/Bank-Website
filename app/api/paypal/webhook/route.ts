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
        // Handle completed payment (deposit)
        console.log("Payment completed:", resource.id)

        // Find the transaction by PayPal payment ID
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .select("*")
          .eq("reference", resource.parent_payment)
          .single()

        if (transactionError || !transaction) {
          console.error("Transaction not found:", resource.parent_payment)
          break
        }

        // Update transaction status
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        // Update user balance for deposit
        if (transaction.transaction_type === "deposit") {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("account_balance")
            .eq("id", transaction.user_id)
            .single()

          if (!userError && userData) {
            const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
            const newBalance = currentBalance + transaction.amount

            await supabase
              .from("users")
              .update({
                account_balance: newBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("id", transaction.user_id)

            console.log("Balance updated via webhook:", { userId: transaction.user_id, amount: transaction.amount })
          }
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        // Handle failed or refunded payment
        console.log("Payment failed/refunded:", resource.id)

        await supabase
          .from("transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("reference", resource.parent_payment)
        break

      case "PAYOUTS.PAYOUT-ITEM.SUCCEEDED":
        // Handle successful payout (withdrawal)
        console.log("Payout succeeded:", resource.payout_item_id)

        await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("reference", resource.payout_batch_id)
        break

      case "PAYOUTS.PAYOUT-ITEM.FAILED":
        // Handle failed payout - refund user balance
        console.log("Payout failed:", resource.payout_item_id)

        const { data: failedTransaction, error: failedError } = await supabase
          .from("transactions")
          .select("*")
          .eq("reference", resource.payout_batch_id)
          .single()

        if (!failedError && failedTransaction) {
          // Refund the user's balance
          const { data: failedUserData, error: failedUserError } = await supabase
            .from("users")
            .select("account_balance")
            .eq("id", failedTransaction.user_id)
            .single()

          if (!failedUserError && failedUserData) {
            const currentBalance = Number.parseFloat(failedUserData.account_balance?.toString() || "0")
            const refundedBalance = currentBalance + failedTransaction.amount

            await supabase
              .from("users")
              .update({
                account_balance: refundedBalance,
                updated_at: new Date().toISOString(),
              })
              .eq("id", failedTransaction.user_id)

            console.log("Balance refunded due to failed payout:", {
              userId: failedTransaction.user_id,
              amount: failedTransaction.amount,
            })
          }

          // Update transaction status
          await supabase
            .from("transactions")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedTransaction.id)
        }
        break

      default:
        console.log("Unhandled webhook event:", eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
