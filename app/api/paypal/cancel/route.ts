import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token") // PayPal order ID

    console.log("❌ PayPal payment cancelled:", token)

    if (token) {
      // Update transaction status to cancelled
      const supabase = createRouteHandlerClient({ cookies })

      await supabase
        .from("transactions")
        .update({
          status: "cancelled",
          metadata: {
            cancelled_at: new Date().toISOString(),
            cancellation_reason: "user_cancelled",
          },
        })
        .eq("reference", token)
        .eq("status", "pending")
    }

    return NextResponse.redirect(new URL("/dashboard/transfers?cancelled=true", request.url))
  } catch (error) {
    console.error("❌ PayPal cancel handler error:", error)
    return NextResponse.redirect(new URL("/dashboard/transfers?error=cancel_failed", request.url))
  }
}
