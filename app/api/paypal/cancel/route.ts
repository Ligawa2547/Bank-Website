import type { NextRequest } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const paymentId = searchParams.get("paymentId")

    console.log("PayPal cancel callback:", { paymentId })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("User not authenticated")
      redirect("/login")
    }

    if (paymentId) {
      // Update the transaction status to cancelled
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", paymentId)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
      } else {
        console.log("Transaction marked as cancelled")
      }
    }

    redirect("/dashboard/transfers?error=payment_cancelled")
  } catch (error: any) {
    console.error("PayPal cancel handler error:", error)
    redirect("/dashboard/transfers?error=cancel_failed")
  }
}
