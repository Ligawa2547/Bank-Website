import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import {
  sendTransactionEmail,
  sendKYCStatusEmail,
  sendAccountStatusEmail,
  sendGeneralNotificationEmail,
  getUserByAccountNumber,
  getUserById,
} from "@/lib/email/notifications"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { type, accountNumber, userId, transactionData, kycData, accountStatusData, notificationData } = body

    let user = null

    // Get user details
    if (accountNumber) {
      user = await getUserByAccountNumber(accountNumber)
    } else if (userId) {
      user = await getUserById(userId)
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userName = `${user.first_name} ${user.last_name}`

    // Send appropriate email based on type
    switch (type) {
      case "transaction":
        if (transactionData) {
          await sendTransactionEmail(
            user.email,
            userName,
            transactionData.transactionType,
            transactionData.amount,
            transactionData.status,
            transactionData.reference,
            transactionData.description,
          )
        }
        break

      case "kyc":
        if (kycData) {
          await sendKYCStatusEmail(user.email, userName, kycData.status, kycData.rejectionReason)
        }
        break

      case "account_status":
        if (accountStatusData) {
          await sendAccountStatusEmail(user.email, userName, accountStatusData.status, accountStatusData.reason)
        }
        break

      case "general":
        if (notificationData) {
          await sendGeneralNotificationEmail(
            user.email,
            userName,
            notificationData.title,
            notificationData.message,
            notificationData.type || "info",
          )
        }
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Error sending notification email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
