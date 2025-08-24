import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const paymentId = searchParams.get("paymentId")
    const payerId = searchParams.get("PayerID")

    console.log("PayPal success callback:", { paymentId, payerId })

    if (!paymentId || !payerId) {
      console.error("Missing payment parameters")
      redirect("/dashboard/transfers?error=missing_parameters")
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("User not authenticated")
      redirect("/login")
    }

    // Execute the PayPal payment
    const executedPayment = await paypalClient.executePayment(paymentId!, payerId!)

    console.log("Payment executed:", executedPayment.state)

    if (executedPayment.state === "approved") {
      // Get the transaction amount from the executed payment
      const amount = Number.parseFloat(executedPayment.transactions[0].amount.total)

      // Update the transaction status to completed
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
      }

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error getting user data:", userError)
      } else {
        const currentBalance = Number.parseFloat(userData.account_balance?.toString() || "0")
        const newBalance = currentBalance + amount

        const { error: balanceError } = await supabase
          .from("users")
          .update({
            account_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (balanceError) {
          console.error("Error updating balance:", balanceError)
        } else {
          console.log("Balance updated successfully:", { oldBalance: currentBalance, newBalance })
        }
      }

      redirect("/dashboard/transfers?success=deposit_completed")
    } else {
      console.error("Payment not approved:", executedPayment.state)

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("user_id", user.id)

      redirect("/dashboard/transfers?error=payment_failed")
    }
  } catch (error: any) {
    console.error("PayPal success handler error:", error)
    redirect("/dashboard/transfers?error=processing_failed")
  }
}
