import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendTransactionNotification } from "@/lib/notifications/handler"
import { logAuditEvent } from "@/lib/audit/logger"

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const { amount, customer, metadata } = paystackData.data
    const amountInDollars = amount / 100 // Paystack amount is in kobo

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, account_no, balance")
      .eq("email", customer.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Paystack references are unique. Replays must not credit the account twice.
    const { data: existingTransaction } = await supabase
      .from("transactions")
      .select("id, amount, status")
      .eq("reference", reference)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: "Payment was already processed",
      })
    }

    // Update user balance
    const newBalance = (user.balance || 0) + amountInDollars
    const { error: balanceError } = await supabase.from("users").update({ balance: newBalance }).eq("id", user.id)

    if (balanceError) {
      console.error("Error updating balance:", balanceError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      transaction_type: "deposit",
      amount: amountInDollars,
      status: "completed",
      payment_method: "paystack",
      narration: `Deposit via Paystack - ${reference}`,
      reference: reference,
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
    }

    // Send notification and email
    try {
      await sendTransactionNotification(
        user.account_no,
        "deposit",
        amountInDollars,
        "completed",
        reference,
        `Deposit via Paystack - ${reference}`,
      )
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
      // Don't fail the transaction if notification fails
    }

    await logAuditEvent({
      userId: user.id,
      action: "paystack_deposit_verified",
      resourceType: "transaction",
      resourceId: reference,
      description: "Paystack deposit verified and credited",
      changes: { amount: amountInDollars, reference },
      status: "success",
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified and balance updated",
      newBalance,
    })
  } catch (error) {
    console.error("Error verifying Paystack payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
