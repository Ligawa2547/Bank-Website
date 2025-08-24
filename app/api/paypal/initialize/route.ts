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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, type, description } = await request.json()

    console.log("PayPal initialize request:", { amount, type, description, userId: user.id })

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Validate type
    if (!["deposit", "withdrawal"].includes(type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    // Get user profile from users table with correct column name
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("account_number, first_name, last_name, email, account_balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("User profile found:", {
      accountNumber: profile.account_number,
      email: profile.email,
      balance: profile.account_balance,
    })

    let paypalResponse

    if (type === "deposit") {
      // Create PayPal payment for deposit
      paypalResponse = await paypalClient.createPayment(
        amount,
        "USD",
        description || `Deposit to account ${profile.account_number}`,
      )

      // Store pending transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_no: profile.account_number,
        transaction_type: "deposit",
        amount: amount,
        status: "pending",
        reference: paypalResponse.id,
        narration: description || `PayPal deposit to account ${profile.account_number}`,
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError)
        return NextResponse.json({ error: "Failed to create transaction record" }, { status: 500 })
      }

      // Find approval URL
      const approvalUrl = paypalResponse.links.find((link: any) => link.rel === "approval_url")?.href

      console.log("PayPal payment created, approval URL:", approvalUrl)

      return NextResponse.json({
        success: true,
        paymentId: paypalResponse.id,
        approvalUrl: approvalUrl,
        amount: amount,
        type: type,
      })
    } else if (type === "withdrawal") {
      // For withdrawals, we need the user's PayPal email
      // Using account email as PayPal email for now
      const paypalEmail = profile.email

      // Check if user has sufficient balance using correct column name
      const currentBalance = Number.parseFloat(profile.account_balance?.toString() || "0")

      console.log("Withdrawal request:", { currentBalance, requestedAmount: amount })

      if (currentBalance < amount) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            currentBalance: currentBalance,
            requestedAmount: amount,
          },
          { status: 400 },
        )
      }

      // Create PayPal payout for withdrawal
      paypalResponse = await paypalClient.createPayout(
        paypalEmail,
        amount,
        "USD",
        description || `Withdrawal from account ${profile.account_number}`,
      )

      // Update user balance immediately for withdrawal using correct column name
      const newBalance = currentBalance - amount
      const { error: balanceError } = await supabase
        .from("users")
        .update({
          account_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (balanceError) {
        console.error("Error updating balance:", balanceError)
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
      }

      // Store completed transaction for withdrawal
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_no: profile.account_number,
        transaction_type: "withdrawal",
        amount: amount,
        status: "completed",
        reference: paypalResponse.batch_header.payout_batch_id,
        narration: description || `PayPal withdrawal from account ${profile.account_number}`,
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError)
        // Don't fail the withdrawal if transaction record fails
      }

      console.log("PayPal payout created successfully")

      return NextResponse.json({
        success: true,
        payoutId: paypalResponse.batch_header.payout_batch_id,
        amount: amount,
        type: type,
        status: "completed",
      })
    }
  } catch (error: any) {
    console.error("PayPal initialization error:", error)
    return NextResponse.json(
      {
        error: "Payment initialization failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
