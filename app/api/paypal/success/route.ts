import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function GET(request: NextRequest) {
  try {
    console.log("=== PayPal Success Handler ===")

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const payerId = searchParams.get("PayerID")

    console.log("PayPal success params:", { paymentId, payerId })

    if (!paymentId || !payerId) {
      console.error("Missing required parameters:", { paymentId, payerId })
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=missing_params`)
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_required`)
    }

    try {
      // Execute the PayPal payment
      console.log("Executing PayPal payment...")
      const payment = await paypalClient.executePayment(paymentId, payerId)

      console.log("PayPal payment executed:", {
        id: payment.id,
        state: payment.state,
        amount: payment.transactions[0]?.amount?.total,
      })

      if (payment.state === "approved") {
        // Get the transaction amount
        const amount = Number.parseFloat(payment.transactions[0]?.amount?.total || "0")

        // Get user profile to update balance
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("account_balance, account_no")
          .eq("id", user.id)
          .single()

        if (profileError || !userProfile) {
          console.error("Error fetching user profile:", profileError)
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=profile_error`)
        }

        // Update user balance
        const newBalance = userProfile.account_balance + amount
        const { error: balanceError } = await supabase
          .from("users")
          .update({ account_balance: newBalance })
          .eq("id", user.id)

        if (balanceError) {
          console.error("Error updating balance:", balanceError)
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=balance_update`)
        }

        // Update transaction status
        const { error: transactionError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            balance_after: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("reference", paymentId)
          .eq("user_id", user.id)

        if (transactionError) {
          console.error("Error updating transaction:", transactionError)
          // Don't redirect on transaction update error since balance was already updated
        }

        console.log("PayPal payment completed successfully:", {
          paymentId,
          amount,
          newBalance,
        })

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?success=payment_completed&amount=${amount}`,
        )
      } else {
        console.error("PayPal payment not approved:", payment.state)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=payment_not_approved`,
        )
      }
    } catch (executionError) {
      console.error("Error executing PayPal payment:", executionError)

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("user_id", user.id)

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=execution_failed`)
    }
  } catch (error) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=handler_error`)
  }
}
