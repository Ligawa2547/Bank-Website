import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("=== PayPal Cancel Handler ===")

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")

    console.log("PayPal cancel params:", { paymentId })

    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_required`)
    }

    if (paymentId) {
      // Update transaction status to cancelled
      const { error: transactionError } = await supabase
        .from("transactions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("user_id", user.id)

      if (transactionError) {
        console.error("Error updating transaction status:", transactionError)
      } else {
        console.log("Transaction marked as cancelled:", paymentId)
      }
    }

    console.log("PayPal payment cancelled by user")
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?info=payment_cancelled`)
  } catch (error) {
    console.error("PayPal cancel handler error:", error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?error=cancel_handler_error`)
  }
}
