import { Resend } from "resend"
import {
  WelcomeEmail,
  TransactionEmail,
  KYCEmail,
  AccountEmail,
  PasswordResetEmail,
  GeneralNotificationEmail,
} from "./templates"

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string
  type: "welcome" | "transaction" | "kyc" | "account" | "password_reset" | "general"
  data: any
}

export async function sendNotificationEmail({ to, type, data }: EmailData) {
  try {
    let subject = ""
    let template = null

    switch (type) {
      case "welcome":
        subject = "Welcome to IAE Bank"
        template = WelcomeEmail({
          userName: data.user_name,
          accountNumber: data.account_number,
        })
        break

      case "transaction":
        subject = `Transaction ${data.transaction_type === "deposit" ? "Deposit" : "Withdrawal"} - $${data.amount.toFixed(2)}`
        template = TransactionEmail({
          userName: data.user_name,
          transactionType: data.transaction_type,
          amount: data.amount,
          balance: data.balance,
          paymentMethod: data.payment_method,
          transactionId: data.transaction_id,
          date: data.date,
        })
        break

      case "kyc":
        subject = `KYC Status Update - ${data.status}`
        template = KYCEmail({
          userName: data.user_name,
          status: data.status,
          message: data.message,
        })
        break

      case "account":
        subject = `Account Update - ${data.title}`
        template = AccountEmail({
          userName: data.user_name,
          title: data.title,
          message: data.message,
        })
        break

      case "password_reset":
        subject = "Password Reset Request"
        template = PasswordResetEmail({
          userName: data.user_name,
          resetLink: data.reset_link,
        })
        break

      case "general":
        subject = data.title || "Notification from IAE Bank"
        template = GeneralNotificationEmail({
          userName: data.user_name,
          title: data.title,
          message: data.message,
        })
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    const { data: result, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [to],
      subject,
      react: template,
    })

    if (error) {
      console.error("Email sending error:", error)
      throw error
    }

    console.log("Email sent successfully:", result?.id)
    return result
  } catch (error) {
    console.error("Failed to send notification email:", error)
    throw error
  }
}

export async function sendBulkNotificationEmails(emails: EmailData[]) {
  const results = []

  for (const email of emails) {
    try {
      const result = await sendNotificationEmail(email)
      results.push({ success: true, result })
    } catch (error) {
      results.push({ success: false, error })
    }
  }

  return results
}

// Helper functions for common email types
export async function sendWelcomeEmail(to: string, userName: string, accountNumber: string) {
  return sendNotificationEmail({
    to,
    type: "welcome",
    data: { user_name: userName, account_number: accountNumber },
  })
}

export async function sendTransactionEmail(
  to: string,
  userName: string,
  transactionType: string,
  amount: number,
  balance: number,
  paymentMethod: string,
  transactionId: string,
) {
  return sendNotificationEmail({
    to,
    type: "transaction",
    data: {
      user_name: userName,
      transaction_type: transactionType,
      amount,
      balance,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      date: new Date().toISOString(),
    },
  })
}

export async function sendKYCEmail(to: string, userName: string, status: string, message: string) {
  return sendNotificationEmail({
    to,
    type: "kyc",
    data: { user_name: userName, status, message },
  })
}

export async function sendAccountEmail(to: string, userName: string, title: string, message: string) {
  return sendNotificationEmail({
    to,
    type: "account",
    data: { user_name: userName, title, message },
  })
}

export async function sendPasswordResetEmail(to: string, userName: string, resetLink: string) {
  return sendNotificationEmail({
    to,
    type: "password_reset",
    data: { user_name: userName, reset_link: resetLink },
  })
}
