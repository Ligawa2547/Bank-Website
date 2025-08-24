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
      // Mark the transaction as cancelled
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("status", "pending")

      if (error) {
        console.error("Error updating cancelled transaction:", error)
      }
    }

    return NextResponse.redirect(new URL("/dashboard/transfers?error=payment_cancelled", request.url))
  } catch (error: any) {
    console.error("PayPal cancel handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=payment_cancelled", request.url))
  }
}
