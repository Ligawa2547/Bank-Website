import { type NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { paypalClient } from "@/lib/paypal/client"

export async function POST(request: NextRequest) {
  try {
    const { amount, type, paymentMethod, paypalEmail } = await request.json()

    console.log("PayPal initialize request:", { amount, type, paymentMethod, paypalEmail })

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Amount must be at least $1.00" }, { status: 400 })
    }

    const supabase = createClientComponentClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("account_balance, first_name, last_name, account_no")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    if (type === "deposit") {
      // Create PayPal payment for deposit
      const { paymentId, approvalUrl } = await paypalClient.createPayment(amount, paymentMethod)

      // Create pending transaction record
      const transactionData = {
        user_id: user.id,
        account_no: userProfile.account_no,
        transaction_type: "deposit",
        amount: amount,
        balance_after: userProfile.account_balance, // Will be updated after payment
        narration: `PayPal ${paymentMethod === "card" ? "Card" : "Account"} Deposit - $${amount.toFixed(2)}`,
        reference: paymentId,
        status: "pending",
        payment_method: `paypal_${paymentMethod}`,
        external_reference: paymentId,
      }

      const { error: transactionError } = await supabase.from("transactions").insert([transactionData])

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        return NextResponse.json({ error: "Failed to create transaction record" }, { status: 500 })
      }

      console.log("PayPal payment initialized successfully:", { paymentId, approvalUrl })

      return NextResponse.json({
        success: true,
        paymentId,
        approvalUrl,
        message: "Payment initialized successfully",
      })
    } else if (type === "withdrawal") {
      if (!paypalEmail) {
        return NextResponse.json({ error: "PayPal email is required for withdrawals" }, { status: 400 })
      }

      if (userProfile.account_balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Create PayPal payout for withdrawal
      const payout = await paypalClient.createPayout(amount, paypalEmail)

      // Update user balance
      const newBalance = userProfile.account_balance - amount
      const { error: balanceError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("id", user.id)

      if (balanceError) {
        console.error("Error updating balance:", balanceError)
        return NextResponse.json({ error: "Failed to update account balance" }, { status: 500 })
      }

      // Create transaction record
      const transactionData = {
        user_id: user.id,
        account_no: userProfile.account_no,
        transaction_type: "withdrawal",
        amount: amount,
        balance_after: newBalance,
        narration: `PayPal Withdrawal to ${paypalEmail} - $${amount.toFixed(2)}`,
        reference: payout.batch_header.payout_batch_id,
        status: "completed",
        payment_method: "paypal_payout",
        external_reference: payout.batch_header.payout_batch_id,
      }

      const { error: transactionError } = await supabase.from("transactions").insert([transactionData])

      if (transactionError) {
        console.error("Error creating withdrawal transaction:", transactionError)
        // Note: Balance was already updated, so we don't rollback here
      }

      return NextResponse.json({
        success: true,
        payoutId: payout.batch_header.payout_batch_id,
        message: "Withdrawal processed successfully",
      })
    }

    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
  } catch (error) {
    console.error("PayPal initialize error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
