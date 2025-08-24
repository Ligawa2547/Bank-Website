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

    // Get the pending transaction
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

    try {
      // Execute the PayPal payment
      const executedPayment = await paypalClient.executePayment(paymentId, payerId)

      if (executedPayment.state === "approved") {
        // Update user balance
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("account_balance")
          .eq("id", transaction.user_id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          throw new Error("Failed to fetch user data")
        }

        const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
        const newBalance = currentBalance + transaction.amount

        // Update balance
        const { error: balanceError } = await supabase
          .from("users")
          .update({
            account_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.user_id)

        if (balanceError) {
          console.error("Error updating balance:", balanceError)
          throw new Error("Failed to update balance")
        }

        // Update transaction status
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

        console.log("Payment completed successfully")
        return NextResponse.redirect(new URL("/dashboard/transfers?success=deposit_completed", request.url))
      } else {
        // Payment failed
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        if (updateError) {
          console.error("Error updating transaction:", updateError)
        }

        return NextResponse.redirect(new URL("/dashboard/transfers?error=payment_failed", request.url))
      }
    } catch (paymentError) {
      console.error("Payment execution error:", paymentError)

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      return NextResponse.redirect(new URL("/dashboard/transfers?error=processing_failed", request.url))
    }
  } catch (error) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=processing_failed", request.url))
  }
}
