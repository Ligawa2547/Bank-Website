import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const paymentId = searchParams.get("paymentId")

    console.log("PayPal cancel callback:", { paymentId })

    if (paymentId) {
      // Find and update the transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "cancelled" })
        .eq("reference", paymentId)

      if (updateError) {
        console.error("Error updating cancelled transaction:", updateError)
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=true`)
  } catch (error) {
    console.error("PayPal cancel handler error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=cancel_error`)
  }
}
