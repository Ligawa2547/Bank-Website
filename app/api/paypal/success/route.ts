import { type NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal/client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("🎉 PayPal success callback received")

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("token")
    const payerId = searchParams.get("PayerID")

    if (!orderId || !payerId) {
      console.error("❌ Missing required parameters:", { orderId, payerId })
      return NextResponse.redirect(new URL("/dashboard/transfers?error=missing_payment_params", request.url))
    }

    console.log(`💰 Processing PayPal order: ${orderId} for payer: ${payerId}`)

    // Verify user authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=auth_required", request.url))
    }

    // Get the pending transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference", orderId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single()

    if (transactionError || !transaction) {
      console.error("❌ Transaction not found:", transactionError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=transaction_not_found", request.url))
    }

    // Capture the PayPal order
    const captureResult = await paypalClient.captureOrder(orderId)

    if (captureResult.status !== "COMPLETED") {
      console.error("❌ PayPal capture not completed:", captureResult.status)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=payment_not_completed", request.url))
    }

    // Get user's current balance
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=profile_error", request.url))
    }

    // Update user balance
    const newBalance = (userProfile.account_balance || 0) + transaction.amount
    const { error: balanceError } = await supabase
      .from("users")
      .update({ account_balance: newBalance })
      .eq("id", user.id)

    if (balanceError) {
      console.error("❌ Error updating balance:", balanceError)
      return NextResponse.redirect(new URL("/dashboard/transfers?error=balance_update", request.url))
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "completed",
        balance_after: newBalance,
        metadata: {
          ...transaction.metadata,
          paypal_capture_id: captureResult.id,
          paypal_payer_id: payerId,
          completed_at: new Date().toISOString(),
        },
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("❌ Error updating transaction:", updateError)
      // Don't redirect to error since balance was already updated
    }

    console.log(`✅ Payment completed successfully! New balance: $${newBalance}`)

    return NextResponse.redirect(
      new URL(`/dashboard/transfers?success=payment_completed&amount=${transaction.amount}`, request.url),
    )
  } catch (error) {
    console.error("❌ PayPal success handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=handler_error", request.url))
  }
}
