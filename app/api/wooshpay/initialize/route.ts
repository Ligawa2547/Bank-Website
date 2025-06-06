import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { wooshPayClient } from "@/lib/wooshpay/client"

export async function POST(request: Request) {
  console.log("WooshPay initialize endpoint called")

  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("Session found for user:", session.user.id)

    // Parse request body
    const body = await request.json()
    console.log("Request body:", body)

    const { email, amount, reference, metadata } = body

    // Validate required fields
    if (!email || !amount || !reference) {
      console.log("Missing required fields:", { email: !!email, amount: !!amount, reference: !!reference })
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Get user profile for additional metadata
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, phone_number, account_no")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user profile:", userError)
    }

    console.log("User profile:", userProfile)

    // Initialize WooshPay transaction
    const wooshPayData = {
      email,
      amount: Number(amount), // Keep as dollars, not cents for WooshPay
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?verify=${reference}`,
      metadata: {
        user_id: session.user.id,
        account_no: userProfile?.account_no,
        ...metadata,
      },
      customer: {
        name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : undefined,
        phone: userProfile?.phone_number,
      },
    }

    console.log("Sending to WooshPay:", wooshPayData)

    const wooshPayResponse = await wooshPayClient.initializePayment(wooshPayData)

    console.log("WooshPay response:", wooshPayResponse)

    if (!wooshPayResponse.status) {
      console.log("WooshPay returned error:", wooshPayResponse.message)
      return NextResponse.json(
        {
          message: wooshPayResponse.message || "Payment initialization failed",
        },
        { status: 400 },
      )
    }

    if (!wooshPayResponse.data) {
      console.log("WooshPay response missing data")
      return NextResponse.json(
        {
          message: "Invalid response from payment gateway",
        },
        { status: 500 },
      )
    }

    console.log("Payment initialized successfully")
    return NextResponse.json(wooshPayResponse.data)
  } catch (error: any) {
    console.error("WooshPay initialization error:", error)
    return NextResponse.json(
      {
        message: error.message || "Internal server error",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
