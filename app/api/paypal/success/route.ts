import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const PayerID = searchParams.get("PayerID")
    const token = searchParams.get("token")

    if (!paymentId || !PayerID || !token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_parameters`)
    }

    // Execute PayPal payment
    const executeResponse = await fetch(`https://api-m.sandbox.paypal.com/v1/payments/payment/${paymentId}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getPayPalAccessToken()}`,
      },
      body: JSON.stringify({
        payer_id: PayerID,
      }),
    })

    const executeData = await executeResponse.json()

    if (executeData.state === "approved") {
      const supabase = createRouteHandlerClient({ cookies })

      // Get transaction details from PayPal response
      const transaction = executeData.transactions[0]
      const amount = Number.parseFloat(transaction.amount.total)
      const accountNo = transaction.custom // We stored account_no in custom field

      // Update user balance
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("account_no", accountNo)
        .single()

      if (userError) {
        console.error("User not found:", userError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=user_not_found`)
      }

      const newBalance = (user.account_balance || 0) + amount

      const { error: updateError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("account_no", accountNo)

      if (updateError) {
        console.error("Error updating balance:", updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=update_failed`)
      }

      // Record transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        account_no: accountNo,
        transaction_type: "Deposit",
        amount,
        status: "completed",
        reference: paymentId,
        description: "PayPal deposit",
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Error recording transaction:", transactionError)
      }

      // Send notification and email
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "transaction",
            accountNo,
            transactionType: "Deposit",
            amount,
            status: "completed",
            reference: paymentId,
            description: "PayPal deposit",
          }),
        })
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError)
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=payment_completed`)
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=payment_failed`)
    }
  } catch (error) {
    console.error("PayPal success handler error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=processing_failed`)
  }
}

async function getPayPalAccessToken(): Promise<string> {
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  return data.access_token
}
