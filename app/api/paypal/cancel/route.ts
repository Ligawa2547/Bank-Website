import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    const type = searchParams.get("type")

    console.log("PayPal cancel callback:", { reference, type })

    if (reference) {
      const supabase = createRouteHandlerClient({ cookies })

      // Update transaction status to cancelled
      await supabase
        .from("transactions")
        .update({
          status: "cancelled",
          narration: "PayPal payment cancelled by user",
        })
        .eq("reference", reference)

      console.log("Transaction marked as cancelled:", reference)
    }

    return NextResponse.redirect(new URL("/dashboard?info=payment_cancelled", request.url))
  } catch (error: any) {
    console.error("PayPal cancel handler error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=cancel_error", request.url))
  }
}
