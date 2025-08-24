import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { paypalClient } from "@/lib/paypal/client"

export async function POST(request: NextRequest) {
  try {
    console.log("=== PayPal Initialize API Route ===")

    const { amount, type, paymentMethod, paypalEmail } = await request.json()

    console.log("PayPal initialize request:", { amount, type, paymentMethod, paypalEmail })

    // Validate environment variables
    console.log("Environment variables check:", {
      hasPayPalClientId: !!process.env.PAYPAL_CLIENT_ID,
      hasPayPalClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      paypalClientIdLength: process.env.PAYPAL_CLIENT_ID?.length || 0,
      paypalClientSecretLength: process.env.PAYPAL_CLIENT_SECRET?.length || 0,
    })

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Amount must be at least $1.00" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("User authenticated:", { userId: user.id, email: user.email })

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

    if (!userProfile) {
      console.error("User profile not found for user:", user.id)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    console.log("User profile loaded:", {
      accountNo: userProfile.account_no,
      balance: userProfile.account_balance,
      name: `${userProfile.first_name} ${userProfile.last_name}`,
    })

    if (type === "deposit") {
      try {
        console.log("Processing PayPal deposit...")

        // Create PayPal payment for deposit
        const { paymentId, approvalUrl } = await paypalClient.createPayment(amount, paymentMethod)

        console.log("PayPal payment created successfully:", { paymentId, approvalUrl })

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
          created_at: new Date().toISOString(),
        }

        console.log("Creating transaction record:", transactionData)

        const { error: transactionError } = await supabase.from("transactions").insert([transactionData])

        if (transactionError) {
          console.error("Error creating transaction:", transactionError)
          return NextResponse.json({ error: "Failed to create transaction record" }, { status: 500 })
        }

        console.log("Transaction record created successfully")
        console.log("=== PayPal Initialize Success ===")

        return NextResponse.json({
          success: true,
          paymentId,
          approvalUrl,
          message: "Payment initialized successfully",
        })
      } catch (paypalError) {
        console.error("=== PayPal Initialize Error ===")
        console.error("PayPal payment creation failed:", paypalError)

        const errorMessage = paypalError instanceof Error ? paypalError.message : "Failed to create PayPal payment"

        return NextResponse.json(
          {
            error: errorMessage,
            details:
              "Please check your PayPal configuration and credentials. Make sure your PayPal app is active and configured correctly.",
            troubleshooting: {
              step1: "Verify your PayPal Client ID and Secret in the PayPal Developer Dashboard",
              step2: "Ensure your PayPal app is active and not restricted",
              step3: "Check that you're using the correct sandbox/production credentials",
              step4: "Verify your app has the required permissions for payments",
              step5: "Make sure your app is approved for live payments if using production",
            },
          },
          { status: 500 },
        )
      }
    } else if (type === "withdrawal") {
      if (!paypalEmail) {
        return NextResponse.json({ error: "PayPal email is required for withdrawals" }, { status: 400 })
      }

      if (userProfile.account_balance < amount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      try {
        console.log("Processing PayPal withdrawal...")

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
          created_at: new Date().toISOString(),
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
      } catch (paypalError) {
        console.error("PayPal payout creation failed:", paypalError)
        return NextResponse.json(
          {
            error: paypalError instanceof Error ? paypalError.message : "Failed to create PayPal payout",
            details: "Please check your PayPal configuration and credentials",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
  } catch (error) {
    console.error("=== PayPal Initialize Route Error ===")
    console.error("PayPal initialize error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
