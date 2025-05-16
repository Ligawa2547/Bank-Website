import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get reference from URL
    const url = new URL(request.url)
    const reference = url.searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ message: "Reference is required" }, { status: 400 })
    }

    // Verify Paystack transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ message: data.message }, { status: 400 })
    }

    // If payment is successful, update transaction status
    if (data.data.status === "success") {
      const supabase = createRouteHandlerClient({ cookies })

      // Get transaction details
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference", reference)
        .single()

      if (transactionError || !transactionData) {
        return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
      }

      // Update transaction status
      await supabase.from("transactions").update({ status: "completed" }).eq("reference", reference)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("account_no", transactionData.account_no)
        .single()

      if (profileError || !profileData) {
        return NextResponse.json({ message: "User profile not found" }, { status: 404 })
      }

      // Update user's balance
      await supabase
        .from("user_profiles")
        .update({ balance: profileData.balance + transactionData.amount })
        .eq("account_no", transactionData.account_no)

      // Create notification
      await supabase.from("notifications").insert({
        account_no: transactionData.account_no,
        title: "Deposit Successful",
        message: `Your account has been credited with USD ${transactionData.amount.toFixed(2)}`,
        is_read: false,
      })
    }

    return NextResponse.json(data.data)
  } catch (error: any) {
    console.error("Paystack verification error:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
