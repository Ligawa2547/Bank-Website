import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function POST(request: NextRequest) {
  try {
    console.log("PayPal initialize route called")

    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, paymentMethod, email } = body

    console.log("PayPal initialize request body:", body)

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!type || !["deposit", "withdrawal"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    if (type === "withdrawal" && !email) {
      return NextResponse.json({ error: "Email required for withdrawal" }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("account_no, account_balance, first_name, last_name")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    console.log("User profile found:", { account_no: profile.account_no, balance: profile.account_balance })

    // For withdrawals, check if user has sufficient balance
    if (type === "withdrawal" && profile.account_balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Generate unique reference
    const reference = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: session.user.id,
      account_no: profile.account_no,
      transaction_type: type,
      amount: amount,
      status: "pending",
      reference: reference,
      narration:
        type === "deposit" ? `PayPal Deposit - ${paymentMethod === "card" ? "Card" : "Account"}` : "PayPal Withdrawal",
      recipient_account_number: type === "deposit" ? profile.account_no : null,
      recipient_name: type === "deposit" ? `${profile.first_name} ${profile.last_name}` : null,
    })

    if (transactionError) {
      console.error("Transaction creation error:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    console.log("Transaction created with reference:", reference)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = `${baseUrl}/api/paypal/success?reference=${reference}&type=${type}&paymentMethod=${paymentMethod}`
    const cancelUrl = `${baseUrl}/api/paypal/cancel?reference=${reference}&type=${type}`

    if (type === "deposit") {
      try {
        console.log("Creating PayPal payment for deposit...")

        // Create PayPal payment with proper payment method
        const payment = await paypalClient.createPayment(
          amount,
          `${paymentMethod === "card" ? "Card" : "PayPal"} Deposit to account ${profile.account_no}`,
          returnUrl,
          cancelUrl,
          paymentMethod,
        )

        const approvalUrl = paypalClient.getApprovalUrl(payment)

        if (!approvalUrl) {
          console.error("No approval URL found in PayPal response")
          return NextResponse.json({ error: "Failed to get PayPal approval URL" }, { status: 500 })
        }

        // Store payment ID for later execution
        await supabase
          .from("transactions")
          .update({
            narration: `PayPal Deposit - ${paymentMethod === "card" ? "Card" : "Account"} Payment ID: ${payment.id}`,
          })
          .eq("reference", reference)

        console.log("PayPal payment created successfully:", { paymentId: payment.id, approvalUrl })

        return NextResponse.json({
          approvalUrl,
          paymentId: payment.id,
          reference,
          paymentMethod,
        })
      } catch (error: any) {
        console.error("PayPal payment creation error:", error)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference)

        return NextResponse.json({ error: error.message || "Failed to create PayPal payment" }, { status: 500 })
      }
    } else {
      // Handle withdrawal - create payout
      try {
        console.log("Creating PayPal payout for withdrawal...")

        const payout = await paypalClient.createPayout(amount, email, `Withdrawal from account ${profile.account_no}`)

        // Update transaction with payout details
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            narration: `PayPal Withdrawal - Batch ID: ${payout.batch_header.payout_batch_id}`,
          })
          .eq("reference", reference)

        // Update user balance
        await supabase
          .from("users")
          .update({ account_balance: profile.account_balance - amount })
          .eq("id", session.user.id)

        console.log("PayPal payout created successfully")

        return NextResponse.json({
          success: true,
          message: "Withdrawal initiated successfully",
          batchId: payout.batch_header.payout_batch_id,
        })
      } catch (error: any) {
        console.error("PayPal payout error:", error)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("reference", reference)

        return NextResponse.json({ error: error.message || "Failed to process withdrawal" }, { status: 500 })
      }
    }
  } catch (error: any) {
    console.error("PayPal initialization error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
