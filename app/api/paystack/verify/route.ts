import { type NextRequest, NextResponse } from "next/server"
import { verifyTransaction } from "@/lib/paystack/verify"
import { updateTransaction } from "@/lib/database/transactions"
import { sendTransactionNotification } from "@/lib/notifications/handler"

export async function POST(request: NextRequest) {
  const { reference } = await request.json()

  try {
    const transactionDetails = await verifyTransaction(reference)

    if (transactionDetails.status === "success") {
      const updatedTransaction = await updateTransaction(reference, transactionDetails)

      if (updatedTransaction) {
        // Send notification and email
        await sendTransactionNotification(
          updatedTransaction.account_no,
          updatedTransaction.transaction_type,
          updatedTransaction.amount,
          "completed",
          updatedTransaction.reference,
          updatedTransaction.description || "Paystack deposit",
        )
      }

      return NextResponse.json(
        { message: "Transaction verified and updated successfully", transaction: updatedTransaction },
        { status: 200 },
      )
    } else {
      return NextResponse.json({ message: "Transaction verification failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return NextResponse.json({ message: "An error occurred while verifying the transaction" }, { status: 500 })
  }
}
