import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, paymentMethod, paypalEmail } = body

    console.log("PayPal initialize request:", { amount, type, paymentMethod, paypalEmail, userId: user.id })

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!type || !["deposit", "withdrawal"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("account_no, account_balance, first_name, last_name")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (type === "withdrawal") {
      if (!paypalEmail) {
        return NextResponse.json({ error: "PayPal email is required for withdrawals" }, { status: 400 })
      }

      if (userProfile.account_balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Create transaction record for withdrawal
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_no: userProfile.account_no,
          transaction_type: "withdrawal",
          amount: amount,
          status: "pending",
          reference: `WD${Date.now()}`,
          narration: `PayPal withdrawal to ${paypalEmail}`,
          recipient_name: paypalEmail,
          recipient_account_number: paypalEmail,
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Transaction creation error:", transactionError)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
      }

      try {
        // Create PayPal payout
        const payout = await paypalClient.createPayout(
          amount,
          paypalEmail,
          `Withdrawal from ${userProfile.first_name} ${userProfile.last_name}`,
        )

        // Update transaction status
        await supabase
          .from("transactions")
          .update({
            status: "completed",
            reference: payout.batch_header?.payout_batch_id || transaction.reference,
          })
          .eq("id", transaction.id)

        // Update user balance
        await supabase
          .from("users")
          .update({ account_balance: userProfile.account_balance - amount })
          .eq("id", user.id)

        return NextResponse.json({
          success: true,
          message: "Withdrawal processed successfully",
          transactionId: transaction.id,
        })
      } catch (error) {
        console.error("PayPal payout error:", error)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Failed to process withdrawal",
          },
          { status: 500 },
        )
      }
    } else {
      // Handle deposit
      const description =
        paymentMethod === "card"
          ? `Card deposit to ${userProfile.first_name} ${userProfile.last_name}`
          : `PayPal deposit to ${userProfile.first_name} ${userProfile.last_name}`

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_no: userProfile.account_no,
          transaction_type: "deposit",
          amount: amount,
          status: "pending",
          reference: `DP${Date.now()}`,
          narration: description,
          recipient_name: `${userProfile.first_name} ${userProfile.last_name}`,
          recipient_account_number: userProfile.account_no,
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Transaction creation error:", transactionError)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
      }

      try {
        // Create PayPal payment
        const payment = await paypalClient.createPayment(amount, description, paymentMethod)

        // Find approval URL
        const approvalUrl = payment.links.find((link) => link.rel === "approval_url")?.href

        if (!approvalUrl) {
          throw new Error("No approval URL found in PayPal response")
        }

        // Update transaction with PayPal payment ID
        await supabase.from("transactions").update({ reference: payment.id }).eq("id", transaction.id)

        console.log("PayPal payment created, approval URL:", approvalUrl)

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          approvalUrl: approvalUrl,
          transactionId: transaction.id,
        })
      } catch (error) {
        console.error("PayPal payment creation error:", error)

        // Update transaction status to failed
        await supabase.from("transactions").update({ status: "failed" }).eq("id", transaction.id)

        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Failed to create payment",
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("PayPal initialize error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
