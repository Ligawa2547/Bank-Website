import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { wooshPayClient } from "@/lib/wooshpay/client"
import { getWooshPayServerConfig } from "@/lib/wooshpay/config"

export async function POST(request: NextRequest) {
  console.log("WooshPay verify endpoint called")

  try {
    const config = await getWooshPayServerConfig()

    if (!config.secretKey) {
      return NextResponse.json({ success: false, error: "WooshPay not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { reference } = body

    // Check if WooshPay client is ready
    if (!wooshPayClient.isReady()) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment service is temporarily unavailable",
        },
        { status: 503 },
      )
    }

    // Verify WooshPay transaction
    const wooshPayResponse = await wooshPayClient.verifyPayment(reference)

    console.log("WooshPay verification response:", wooshPayResponse)

    if (!wooshPayResponse.success) {
      return NextResponse.json(
        {
          success: false,
          message: wooshPayResponse.message || "Verification failed",
        },
        { status: 400 },
      )
    }

    // If payment is successful, update transaction status
    if (wooshPayResponse.data?.status === "success") {
      console.log("Payment verified as successful, updating database")

      const supabase = createRouteHandlerClient({ cookies })

      // Get transaction details
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference", reference)
        .single()

      if (transactionError || !transactionData) {
        console.error("Transaction not found:", transactionError)
        return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
      }

      console.log("Found transaction:", transactionData)

      // Update transaction status
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference)

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("account_no", transactionData.account_no)
        .single()

      if (userError || !userData) {
        console.error("User not found:", userError)
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      console.log("Found user:", userData.account_no)

      // Update user's balance
      const newBalance = (userData.account_balance || 0) + wooshPayResponse.data.amount / 100 // Convert kobo to USD
      await supabase
        .from("users")
        .update({
          account_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("account_no", transactionData.account_no)

      console.log(`Updated balance from ${userData.account_balance || 0} to ${newBalance}`)

      // Create notification
      await supabase.from("notifications").insert({
        account_no: transactionData.account_no,
        title: "Deposit Successful",
        message: `Your account has been credited with USD ${(wooshPayResponse.data.amount / 100).toFixed(2)}`,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      console.log("Created notification")
    }

    return NextResponse.json({
      success: wooshPayResponse.success,
      message: wooshPayResponse.message,
      data: wooshPayResponse.data,
    })
  } catch (error: any) {
    console.error("WooshPay verification error:", error)
    return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 500 })
  }
}
