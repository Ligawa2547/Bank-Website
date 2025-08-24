import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const paymentId = searchParams.get("paymentId")
    const payerId = searchParams.get("PayerID")

    console.log("PayPal success callback:", { paymentId, payerId })

    if (!paymentId || !payerId) {
      console.error("Missing payment parameters")
      return NextResponse.redirect(new URL("/dashboard/transfers?error=missing_parameters", request.url))
    }

    try {
      // Execute the payment
      const executedPayment = await paypalClient.executePayment(paymentId, payerId)

      console.log("Payment executed successfully:", executedPayment)

      if (executedPayment.state === "approved") {
        // Find the pending transaction
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .select("*")
          .eq("reference", paymentId)
          .eq("status", "pending")
          .single()

        if (transactionError || !transaction) {
          console.error("Transaction not found:", transactionError)
          return NextResponse.redirect(new URL("/dashboard/transfers?error=transaction_not_found", request.url))
        }

        // Update user balance
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("account_balance")
          .eq("id", transaction.user_id)
          .single()

        if (userError || !userData) {
          console.error("User not found:", userError)
          return NextResponse.redirect(new URL("/dashboard/transfers?error=user_not_found", request.url))
        }

        const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
        const newBalance = currentBalance + transaction.amount

        // Update balance and transaction status
        const { error: balanceError } = await supabase
          .from("users")
          .update({
            account_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.user_id)

        if (balanceError) {
          console.error("Error updating balance:", balanceError)
          return NextResponse.redirect(new URL("/dashboard/transfers?error=balance_update_failed", request.url))
        }

        // Mark transaction as completed
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        if (updateError) {
          console.error("Error updating transaction:", updateError)
        }

        console.log("Deposit completed successfully")
        return NextResponse.redirect(new URL("/dashboard/transfers?success=deposit_completed", request.url))
      } else {
        console.error("Payment not approved:", executedPayment.state)
        return NextResponse.redirect(new URL("/dashboard/transfers?error=payment_failed", request.url))
      }
    } catch (error: any) {
      console.error("Error executing payment:", error)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=processing_failed", request.url))
    }
  } catch (error: any) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=processing_failed", request.url))
  }
}
