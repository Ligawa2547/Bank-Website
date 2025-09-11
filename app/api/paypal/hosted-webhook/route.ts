import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { sendNotificationEmail } from "@/lib/email/notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("PayPal hosted webhook received:", body)

    // Verify the webhook is from PayPal (implement proper verification in production)
    const eventType = body.event_type

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const payment = body.resource
      const amount = Number.parseFloat(payment.amount.value)
      const currency = payment.amount.currency_code
      const paymentId = payment.id

      // Extract user information from custom field or payer info
      const payerEmail = payment.payer?.email_address

      if (!payerEmail) {
        console.error("No payer email found in webhook")
        return NextResponse.json({ error: "No payer email" }, { status: 400 })
      }

      const supabase = await createServerClient()

      // Find user by email
      const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", payerEmail).single()

      if (userError || !user) {
        console.error("User not found:", payerEmail)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Update user balance
      const newBalance = (user.account_balance || 0) + amount

      const { error: balanceError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("id", user.id)

      if (balanceError) {
        console.error("Error updating balance:", balanceError)
        return NextResponse.json({ error: "Balance update failed" }, { status: 500 })
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        transaction_type: "deposit",
        amount: amount,
        balance_after: newBalance,
        status: "completed",
        payment_method: "PayPal Hosted",
        narration: `PayPal hosted deposit - ${paymentId}`,
        metadata: {
          payment_id: paymentId,
          currency: currency,
          payer_email: payerEmail,
          webhook_event: eventType,
        },
      })

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        return NextResponse.json({ error: "Transaction creation failed" }, { status: 500 })
      }

      // Create notification
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: user.id,
        type: "transaction",
        title: "Deposit Successful",
        message: `Your PayPal deposit of $${amount.toFixed(2)} has been processed successfully.`,
        metadata: {
          transaction_type: "deposit",
          amount: amount,
          payment_method: "PayPal Hosted",
          payment_id: paymentId,
        },
      })

      if (notificationError) {
        console.error("Error creating notification:", notificationError)
      }

      // Send email notification
      try {
        await sendNotificationEmail({
          to: user.email,
          type: "transaction",
          data: {
            user_name: `${user.first_name} ${user.last_name}`,
            transaction_type: "deposit",
            amount: amount,
            balance: newBalance,
            payment_method: "PayPal Hosted",
            transaction_id: paymentId,
            date: new Date().toISOString(),
          },
        })
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Don't fail the webhook for email errors
      }

      console.log(`PayPal hosted deposit processed: $${amount} for ${payerEmail}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ message: "Event not processed" })
  } catch (error) {
    console.error("PayPal hosted webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
