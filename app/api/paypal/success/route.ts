import { type NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal/client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token") // PayPal order ID
    const payerId = searchParams.get("PayerID")

    console.log("🎉 PayPal success callback received:", { token, payerId })

    if (!token) {
      return NextResponse.redirect(new URL("/dashboard/transfers?error=missing_token", request.url))
    }

    // Capture the PayPal order
    const captureResult = await paypalClient.captureOrder(token)
    console.log("💰 PayPal capture result:", captureResult.status)

    if (captureResult.status !== "COMPLETED") {
      console.error("❌ PayPal capture not completed:", captureResult.status)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=capture_failed", request.url))
    }

    // Get payment details
    const captureDetails = captureResult.purchase_units[0].payments.captures[0]
    const amount = Number.parseFloat(captureDetails.amount.value)

    // Update database
    const supabase = createRouteHandlerClient({ cookies })

    // Get the pending transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", token)
      .eq("status", "pending")
      .single()

    if (fetchError || !transaction) {
      console.error("❌ Transaction not found:", fetchError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=transaction_not_found", request.url))
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        metadata: {
          ...transaction.metadata,
          paypal_capture_id: captureDetails.id,
          paypal_payer_id: payerId,
          completed_at: new Date().toISOString(),
        },
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("❌ Failed to update transaction:", updateError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=update_failed", request.url))
    }

    // Update user balance
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", transaction.user_id)
      .single()

    if (userError) {
      console.error("❌ Failed to get user balance:", userError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=balance_update_failed", request.url))
    }

    const newBalance = (user.account_balance || 0) + amount

    const { error: balanceError } = await supabase
      .from("users")
      .update({ account_balance: newBalance })
      .eq("id", transaction.user_id)

    if (balanceError) {
      console.error("❌ Failed to update balance:", balanceError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=balance_update_failed", request.url))
    }

    // Update transaction with final balance
    await supabase.from("transactions").update({ balance_after: newBalance }).eq("id", transaction.id)

    console.log("✅ PayPal payment completed successfully")
    return NextResponse.redirect(new URL("/dashboard?success=payment_completed", request.url))
  } catch (error) {
    console.error("❌ PayPal success handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=processing_failed", request.url))
  }
}
