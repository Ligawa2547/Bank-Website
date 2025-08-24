import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const payerId = searchParams.get("PayerID")
    const reference = searchParams.get("reference")
    const type = searchParams.get("type")
    const paymentMethod = searchParams.get("paymentMethod")

    console.log("PayPal success callback:", { paymentId, payerId, reference, type, paymentMethod })

    if (!paymentId || !payerId || !reference) {
      console.error("Missing required parameters")
      return NextResponse.redirect(new URL("/dashboard?error=missing_parameters", request.url))
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", reference)
      .single()

    if (transactionError || !transaction) {
      console.error("Transaction not found:", transactionError)
      return NextResponse.redirect(new URL("/dashboard?error=transaction_not_found", request.url))
    }

    try {
      // Execute the PayPal payment
      console.log("Executing PayPal payment...")
      const executedPayment = await paypalClient.executePayment(paymentId, payerId)

      if (executedPayment.state === "approved") {
        // Update transaction status
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            narration: `${transaction.narration} - Executed successfully`,
          })
          .eq("reference", reference)

        // Update user balance for deposits
        if (type === "deposit") {
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
        }

        console.log("PayPal payment executed successfully")
        return NextResponse.redirect(new URL("/dashboard?success=payment_completed", request.url))
      } else {
        console.error("PayPal payment not approved:", executedPayment.state)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference)

        return NextResponse.redirect(new URL("/dashboard?error=payment_not_approved", request.url))
      }
    } catch (error: any) {
      console.error("PayPal payment execution error:", error)

      // Update transaction status to failed
      await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference)

      return NextResponse.redirect(new URL("/dashboard?error=payment_execution_failed", request.url))
    }
  } catch (error: any) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=internal_error", request.url))
  }
}
