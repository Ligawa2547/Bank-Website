import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("PayPal webhook received:", JSON.stringify(body, null, 2))

    const eventType = body.event_type
    const resource = body.resource

    if (!eventType || !resource) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    switch (eventType) {
      case "PAYMENT.SALE.COMPLETED":
        console.log("Payment sale completed:", resource.id)

        // Find transaction by payment ID
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .select("*")
          .ilike("narration", `%${resource.parent_payment}%`)
          .single()

        if (!transactionError && transaction) {
          await supabase
            .from("transactions")
            .update({
              status: "completed",
              narration: `${transaction.narration} - Webhook confirmed`,
            })
            .eq("id", transaction.id)

          console.log("Transaction updated via webhook:", transaction.id)
        }
        break

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED":
        console.log("Payment denied or refunded:", resource.id)

        // Find and update transaction
        const { data: failedTransaction, error: failedError } = await supabase
          .from("transactions")
          .select("*")
          .ilike("narration", `%${resource.parent_payment}%`)
          .single()

        if (!failedError && failedTransaction) {
          await supabase
            .from("transactions")
            .update({
              status: "failed",
              narration: `${failedTransaction.narration} - ${eventType}`,
            })
            .eq("id", failedTransaction.id)

          console.log("Transaction marked as failed via webhook:", failedTransaction.id)
        }
        break

      default:
        console.log("Unhandled webhook event:", eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
