import { type NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { paypalClient } from "@/lib/paypal/client"
import { PAYPAL_CONFIG } from "@/lib/paypal/config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const payerId = searchParams.get("PayerID")

    console.log("PayPal success callback:", { paymentId, payerId })

    if (!paymentId || !payerId) {
      console.error("Missing payment parameters")
      return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=missing_parameters`)
    }

    const supabase = createClientComponentClient()

    // Find the transaction by PayPal payment ID
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", paymentId)
      .eq("status", "pending")
      .single()

    if (transactionError || !transaction) {
      console.error("Transaction not found:", transactionError)
      return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=transaction_not_found`)
    }

    try {
      // Execute the PayPal payment
      const executedPayment = await paypalClient.executePayment(paymentId, payerId)

      if (executedPayment.state !== "approved") {
        console.error("Payment not approved:", executedPayment.state)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=payment_not_approved`)
      }

      // Get user's current balance
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("id", transaction.user_id)
        .single()

      if (profileError) {
        console.error("Error fetching user profile:", profileError)
        return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=internal_error`)
      }

      // Update user balance
      const newBalance = userProfile.account_balance + transaction.amount
      const { error: balanceError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("id", transaction.user_id)

      if (balanceError) {
        console.error("Error updating balance:", balanceError)
        return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=internal_error`)
      }

      // Update transaction status and balance
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          balance_after: newBalance,
          external_reference: executedPayment.id,
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
        // Balance was updated, so we don't rollback
      }

      console.log("PayPal payment completed successfully:", {
        paymentId,
        amount: transaction.amount,
        newBalance,
      })

      return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?success=payment_completed`)
    } catch (paymentError) {
      console.error("Payment execution failed:", paymentError)

      // Update transaction status to failed
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

      return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=payment_execution_failed`)
    }
  } catch (error) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=internal_error`)
  }
}
