import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { intasendClient } from "@/lib/intasend/client"

export async function POST(request: NextRequest) {
  try {
    const { amount, cardHolder, cardNumber, expiryMonth, expiryYear, cvv } = await request.json()

    // Get authenticated user using anon key first
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log("[v0] Auth check:", authError ? `Error: ${authError.message}` : `User: ${authData.user?.id}`)

    if (!authData.user) {
      console.log("[v0] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use service role key to get user data securely
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("email, account_no")
      .eq("id", authData.user.id)
      .single()

    console.log("[v0] User data fetch:", userError ? `Error: ${userError.message}` : `Found: ${userData?.account_no}`)

    if (userError || !userData) {
      console.log("[v0] User profile not found")
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Validate card data
    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json({ error: "Missing required card details" }, { status: 400 })
    }

    // Initialize IntaSend payment with actual card data
    const paymentResult = await intasendClient.initializePayment({
      amount,
      cardNumber,
      cardHolder,
      expiryMonth,
      expiryYear,
      cvv,
      email: userData.email,
      accountNo: userData.account_no,
      narration: `Card deposit of $${amount}`,
    })

    console.log("[v0] IntaSend response:", paymentResult)

    if (!paymentResult.status) {
      console.log("[v0] Payment failed:", paymentResult.message)
      return NextResponse.json({ error: paymentResult.message || "Payment initialization failed" }, { status: 400 })
    }

    // Record transaction
    const { error: transactionError } = await supabaseAdmin.from("transactions").insert({
      user_id: authData.user.id,
      account_no: userData.account_no,
      transaction_type: "deposit",
      payment_method: "intasend_card",
      amount,
      narration: `Card deposit of $${amount}`,
      reference: paymentResult.data?.id,
      status: "pending",
      metadata: {
        intasend_transaction_id: paymentResult.data?.id,
        intasend_status: paymentResult.data?.status,
      },
    })

    if (transactionError) {
      console.log("[v0] Transaction record error:", transactionError.message)
    }

    console.log("[v0] Payment initialized successfully")
    return NextResponse.json({
      success: true,
      transactionId: paymentResult.data?.id,
      status: paymentResult.data?.status,
    })
  } catch (error) {
    console.error("[v0] IntaSend initialization error:", error)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }
}
