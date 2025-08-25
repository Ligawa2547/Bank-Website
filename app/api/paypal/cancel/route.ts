import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("❌ PayPal payment cancelled")

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("token")

    if (orderId) {
      // Update transaction status to cancelled
      const supabase = createRouteHandlerClient({ cookies })
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from("transactions")
          .update({
            status: "cancelled",
            metadata: {
              cancelled_at: new Date().toISOString(),
            },
          })
          .eq("reference", orderId)
          .eq("user_id", user.id)
          .eq("status", "pending")
      }
    }

    return NextResponse.redirect(new URL("/dashboard/transfers?info=payment_cancelled", request.url))
  } catch (error) {
    console.error("❌ PayPal cancel handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=cancel_handler_error", request.url))
  }
}
