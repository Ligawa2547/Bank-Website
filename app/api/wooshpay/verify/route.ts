import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { wooshPayClient } from "@/lib/wooshpay/client"

export async function GET(request: Request) {
  console.log("WooshPay verify endpoint called")

  try {
    // Get reference from URL
    const url = new URL(request.url)
    const reference = url.searchParams.get("reference")

    console.log("Verifying reference:", reference)

    if (!reference) {
      return NextResponse.json({ message: "Reference is required" }, { status: 400 })
    }

    // Verify WooshPay transaction
    const wooshPayResponse = await wooshPayClient.verifyPayment(reference)

    console.log("WooshPay verification response:", wooshPayResponse)

    if (!wooshPayResponse.status) {
      return NextResponse.json(
        {
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
        return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
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
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      console.log("Found user:", userData.account_no)

      // Update user's balance
      const newBalance = userData.balance + transactionData.amount
      await supabase
        .from("users")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("account_no", transactionData.account_no)

      console.log(`Updated balance from ${userData.balance} to ${newBalance}`)

      // Create notification
      await supabase.from("notifications").insert({
        account_no: transactionData.account_no,
        title: "Deposit Successful",
        message: `Your account has been credited with USD ${transactionData.amount.toFixed(2)}`,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      console.log("Created notification")
    }

    return NextResponse.json({
      status: wooshPayResponse.data?.status || "unknown",
      message: wooshPayResponse.message,
      data: wooshPayResponse.data,
    })
  } catch (error: any) {
    console.error("WooshPay verification error:", error)
    return NextResponse.json(
      {
        message: error.message || "Internal server error",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
