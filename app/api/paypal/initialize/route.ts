import { type NextRequest, NextResponse } from "next/server"
import { paypalClient } from "@/lib/paypal/client"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 PayPal payment initialization started")

    const { amount, paymentMethod = "paypal" } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!["paypal", "card"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Authentication failed:", authError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log(`👤 User ${user.id} requesting ${paymentMethod} payment for $${amount}`)

    // Create PayPal order with specified payment method
    const order = await paypalClient.createOrder(amount, paymentMethod)

    // Store pending transaction in database
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      transaction_type: "deposit",
      amount: amount,
      status: "pending",
      payment_method: paymentMethod === "card" ? "paypal_card" : "paypal",
      narration: `${paymentMethod === "card" ? "Card" : "PayPal"} deposit of $${amount}`,
      reference: order.id,
      metadata: {
        paypal_order_id: order.id,
        paypal_status: order.status,
        payment_method: paymentMethod,
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

    console.log(`✅ PayPal ${paymentMethod} order created successfully:`, order.id)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl: approvalUrl,
      amount: amount,
      paymentMethod: paymentMethod,
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
