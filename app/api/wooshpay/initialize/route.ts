import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { wooshPayClient } from "@/lib/wooshpay/client"
import { getWooshPayServerConfig } from "@/lib/wooshpay/config"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if WooshPay is configured
    const config = await getWooshPayServerConfig()

    if (!config.secretKey) {
      return NextResponse.json({ success: false, error: "WooshPay not configured" }, { status: 503 })
    }

    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { email, amount, reference, metadata } = body

    // Validate required fields
    if (!email || !amount || !reference) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Validate amount
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 })
    }

    // Get user profile for additional metadata
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, phone_number, account_no")
      .eq("id", session.user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 })
    }

    // Create a pending transaction in the database first
    const transactionData = {
      account_no: userProfile.account_no,
      amount: Number(amount),
      transaction_type: "deposit",
      status: "pending",
      reference,
      narration: "Deposit via WooshPay",
      recipient_account_number: userProfile.account_no,
      recipient_name: `${userProfile.first_name} ${userProfile.last_name}`,
      created_at: new Date().toISOString(),
    }

    const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return NextResponse.json({ message: "Failed to create transaction record" }, { status: 500 })
    }

    // Check if WooshPay client is ready
    if (!wooshPayClient.isReady()) {
      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({ status: "failed", narration: "Payment service unavailable" })
        .eq("reference", reference)

      return NextResponse.json(
        {
          message: "Payment service is temporarily unavailable. Please try again later.",
          error: "SERVICE_UNAVAILABLE",
        },
        { status: 503 },
      )
    }

    // Initialize WooshPay transaction
    const wooshPayData = {
      email,
      amount: Number(amount),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/transfers?verify=${reference}`,
      metadata: {
        user_id: session.user.id,
        account_no: userProfile.account_no,
        ...metadata,
      },
      customer: {
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        phone: userProfile.phone_number || "",
        email: email,
      },
    }

    const wooshPayResponse = await wooshPayClient.initializePayment(wooshPayData)

    if (!wooshPayResponse.status) {
      // If WooshPay fails, update transaction status
      await supabase
        .from("transactions")
        .update({ status: "failed", narration: `Failed: ${wooshPayResponse.message}` })
        .eq("reference", reference)

      return NextResponse.json(
        {
          message: wooshPayResponse.message || "Payment initialization failed",
        },
        { status: 400 },
      )
    }

    if (!wooshPayResponse.data?.authorization_url) {
      return NextResponse.json(
        {
          message: "Invalid response from payment gateway",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      authorization_url: wooshPayResponse.data.authorization_url,
      reference: reference,
      amount: amount,
    })
  } catch (error: any) {
    console.error("WooshPay initialization error:", error)
    return NextResponse.json(
      {
        message: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : "Payment service error",
      },
      { status: 500 },
    )
  }
}
