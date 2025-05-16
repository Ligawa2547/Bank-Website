import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Replace with your actual Paystack secret key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const { email, amount, reference, metadata } = await request.json()

    // Validate required fields
    if (!email || !amount || !reference) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        reference,
        metadata,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?verify=${reference}`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ message: data.message }, { status: 400 })
    }

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error("Paystack initialization error:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
