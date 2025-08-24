import { type NextRequest, NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PAYPAL_CONFIG } from "@/lib/paypal/config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    console.log("PayPal payment cancelled:", { token })

    if (token) {
      const supabase = createClientComponentClient()

      // Update transaction status to cancelled
      const { error } = await supabase
        .from("transactions")
        .update({ status: "cancelled" })
        .eq("reference", token)
        .eq("status", "pending")

      if (error) {
        console.error("Error updating cancelled transaction:", error)
        return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=cancel_error`)
      }
    }

    return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?cancelled=true`)
  } catch (error) {
    console.error("PayPal cancel handler error:", error)
    return NextResponse.redirect(`${PAYPAL_CONFIG.APP_URL}/dashboard?error=cancel_error`)
  }
}
