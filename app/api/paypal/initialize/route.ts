import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, type, paymentMethod, paypalEmail } = await request.json()

    console.log("PayPal initialize request:", { amount, type, paymentMethod, paypalEmail, userId: user.id })

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (type === "withdrawal") {
      if (!paypalEmail) {
        return NextResponse.json({ error: "PayPal email is required for withdrawals" }, { status: 400 })
      }

      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_balance, account_no, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (userError || !userData) {
        console.error("User data error:", userError)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      if (userData.account_balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Create withdrawal transaction
      const reference = `WD_${Date.now()}_${user.id}`

      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_no: userData.account_no,
        transaction_type: "withdrawal",
        amount: -amount,
        balance_after: userData.account_balance - amount,
        narration: `PayPal withdrawal to ${paypalEmail}`,
        reference,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Transaction creation error:", transactionError)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
      }

      // Create PayPal payout
      try {
        const payout = await paypalClient.createPayout(amount, paypalEmail, user.id)

        // Update user balance
        await supabase
          .from("users")
          .update({ account_balance: userData.account_balance - amount })
          .eq("id", user.id)

        // Update transaction status
        await supabase.from("transactions").update({ status: "completed" }).eq("reference", reference)

        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          account_no: userData.account_no,
          title: "Withdrawal Successful",
          message: `$${amount.toFixed(2)} has been sent to ${paypalEmail}`,
          type: "transaction",
          is_read: false,
          created_at: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, payoutId: payout.batch_header.payout_batch_id })
      } catch (error) {
        console.error("PayPal payout error:", error)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference)

        return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
      }
    } else {
      // Handle deposit
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_no, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (userError || !userData) {
        console.error("User data error:", userError)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Create PayPal payment
      try {
        const payment = await paypalClient.createPayment(amount, user.id, paymentMethod)

        // Create pending transaction
        const reference = payment.id

        await supabase.from("transactions").insert({
          user_id: user.id,
          account_no: userData.account_no,
          transaction_type: "deposit",
          amount: amount,
          narration: `PayPal ${paymentMethod === "card" ? "card" : "account"} deposit`,
          reference,
          status: "pending",
          created_at: new Date().toISOString(),
        })

        // Get approval URL
        const approvalUrl = payment.links.find((link) => link.rel === "approval_url")?.href

        if (!approvalUrl) {
          throw new Error("No approval URL found in PayPal response")
        }

        console.log("PayPal payment created, approval URL:", approvalUrl)

        return NextResponse.json({
          paymentId: payment.id,
          approvalUrl,
          success: true,
        })
      } catch (error) {
        console.error("PayPal payment creation error:", error)
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to create payment" },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("PayPal initialize error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
