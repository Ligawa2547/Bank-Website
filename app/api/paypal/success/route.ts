import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTransactionNotification } from "@/lib/notifications/handler"
import { sendTransactionEmail } from "@/lib/email/notifications"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { paymentId, payerId, amount, userId, description } = await request.json()

    if (!paymentId || !payerId || !amount || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user details
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create transaction record
    const transactionData = {
      user_id: userId,
      type: "deposit",
      amount: Number.parseFloat(amount),
      description: description || "PayPal Deposit",
      reference: paymentId,
      status: "completed",
      payment_method: "paypal",
      created_at: new Date().toISOString(),
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error("Transaction creation error:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Update user balance
    const newBalance = Number.parseFloat(user.balance) + Number.parseFloat(amount)
    const { error: balanceError } = await supabase.from("users").update({ balance: newBalance }).eq("id", userId)

    if (balanceError) {
      console.error("Balance update error:", balanceError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Send notification
    await sendTransactionNotification(userId, "Deposit", Number.parseFloat(amount), paymentId)

    // Send email notification
    await sendTransactionEmail(user.email, user.full_name, Number.parseFloat(amount), "Deposit", paymentId)

    return NextResponse.json({
      success: true,
      transaction,
      newBalance,
    })
  } catch (error) {
    console.error("PayPal success error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
