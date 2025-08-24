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
      console.error("Missing parameters:", { paymentId, payerId })
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_parameters`)
    }

    // Find the transaction by PayPal payment ID
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", paymentId)
      .single()

    if (transactionError || !transaction) {
      console.error("Transaction not found:", transactionError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=transaction_not_found`)
    }

    try {
      // Execute the PayPal payment
      const executedPayment = await paypalClient.executePayment(paymentId, payerId)

      if (executedPayment.state === "approved") {
        // Update transaction status to completed
        await supabase.from("transactions").update({ status: "completed" }).eq("id", transaction.id)

        // Update user balance
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("account_balance")
          .eq("id", transaction.user_id)
          .single()

        if (!userError && user) {
          await supabase
            .from("users")
            .update({ account_balance: user.account_balance + transaction.amount })
            .eq("id", transaction.user_id)
        }

        console.log("Payment completed successfully:", paymentId)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=payment_completed`)
      } else {
        console.error("Payment not approved:", executedPayment.state)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=payment_not_approved`)
      }
    } catch (error) {
      console.error("PayPal execution error:", error)

      // Update transaction status to failed
      await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=payment_execution_failed`)
    }
  } catch (error) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=internal_error`)
  }
}
