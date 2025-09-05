import { type NextRequest, NextResponse } from "next/server"
import { verifyTransaction } from "@/lib/wooshpay/transaction"
import { sendTransactionNotification } from "@/lib/notifications/handler"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { reference } = body

  try {
    const updatedTransaction = await verifyTransaction(reference)

    if (updatedTransaction) {
      // Send notification and email
      await sendTransactionNotification(
        updatedTransaction.account_no,
        updatedTransaction.transaction_type,
        updatedTransaction.amount,
        "completed",
        updatedTransaction.reference,
        updatedTransaction.description || "WooshPay deposit",
      )

      return NextResponse.json(
        { message: "Transaction verified and notification sent", transaction: updatedTransaction },
        { status: 200 },
      )
    } else {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return NextResponse.json({ message: "Error verifying transaction" }, { status: 500 })
  }
}
