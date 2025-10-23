import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { sendTransactionNotification } from "@/lib/notifications/handler"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, payerId, amount, email } = await request.json()

    if (!paymentId || !payerId || !amount || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, account_no, balance")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user balance
    const newBalance = (user.balance || 0) + amount
    const { error: balanceError } = await supabase.from("users").update({ balance: newBalance }).eq("id", user.id)

    if (balanceError) {
      console.error("Error updating balance:", balanceError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Create transaction record
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      transaction_type: "deposit",
      amount: amount,
      status: "completed",
      payment_method: "paypal",
      narration: `Deposit via PayPal - ${paymentId}`,
      reference: paymentId,
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
        amount,
        "completed",
        paymentId,
        `Deposit via PayPal - ${paymentId}`,
      )
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError)
      // Don't fail the transaction if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment processed and balance updated",
      newBalance,
    })
  } catch (error) {
    console.error("Error processing PayPal payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
