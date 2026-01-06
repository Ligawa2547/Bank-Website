import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { intasendClient } from "@/lib/intasend/client"

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    console.log("[v0] Verifying IntaSend transaction:", transactionId)

    // Get authenticated user with service role key
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      console.log("[v0] Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const verifyResult = await intasendClient.verifyPayment(transactionId)

    console.log("[v0] IntaSend verification result:", verifyResult)

    if (!verifyResult || verifyResult.status !== "COMPLETE") {
      console.log("[v0] Payment not completed:", verifyResult?.status)
      return NextResponse.json(
        {
          error: "Payment verification failed",
          status: verifyResult?.status,
        },
        { status: 400 },
      )
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_no, account_balance")
      .eq("id", authData.user.id)
      .single()

    if (userError || !userData) {
      console.log("[v0] Error fetching user data:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const amount = verifyResult.amount || 0
    const newBalance = (userData.account_balance || 0) + amount

    const { error: balanceError } = await supabase
      .from("users")
      .update({ account_balance: newBalance })
      .eq("id", authData.user.id)

    if (balanceError) {
      console.log("[v0] Error updating balance:", balanceError)
      return NextResponse.json({ error: "Failed to update account balance" }, { status: 500 })
    }

    await supabase.from("transactions").insert({
      user_id: authData.user.id,
      account_no: userData.account_no,
      type: "deposit",
      amount: amount,
      status: "completed",
      reference: transactionId,
      payment_method: "intasend_card",
      narration: `Card deposit of $${amount}`,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Payment verified and balance updated successfully")

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      amount,
      newBalance,
    })
  } catch (error) {
    console.error("[v0] IntaSend verification error:", error)
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 })
  }
}
