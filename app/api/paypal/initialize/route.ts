import { type NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal/client"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 PayPal payment initialization started")

    const { amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Verify user authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log(`👤 User ${user.id} requesting PayPal payment for $${amount}`)

    // Create PayPal order
    const order = await paypalClient.createOrder(amount)

    // Store pending transaction in database
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      transaction_type: "deposit",
      amount: amount,
      status: "pending",
      payment_method: "paypal",
      narration: `PayPal deposit of $${amount}`,
      reference: order.id,
      metadata: {
        paypal_order_id: order.id,
        paypal_status: order.status,
      },
    })

    if (dbError) {
      console.error("❌ Database error:", dbError)
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 })
    }

    // Find the approval URL
    const approvalUrl = order.links?.find((link: any) => link.rel === "payer-action")?.href

    if (!approvalUrl) {
      console.error("❌ No approval URL found in PayPal response")
      return NextResponse.json({ error: "PayPal approval URL not found" }, { status: 500 })
    }

    console.log("✅ PayPal order created successfully:", order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl: approvalUrl,
      amount: amount,
    })
  } catch (error) {
    console.error("❌ PayPal initialization error:", error)
    return NextResponse.json(
      {
        error: "PayPal payment initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
