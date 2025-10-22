"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/resend/client"
import {
  getTransactionEmailTemplate,
  getKYCEmailTemplate,
  getAccountStatusEmailTemplate,
  getGeneralNotificationEmailTemplate,
} from "@/lib/email/templates"

export async function sendNotificationWithEmail(
  accountNo: string,
  title: string,
  message: string,
  type: "transaction" | "kyc" | "account_status" | "general" = "general",
  additionalData?: any,
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("account_no", accountNo)
      .single()

    if (userError || !userData) {
      console.error("User not found:", userError)
      throw new Error("User not found")
    }

    const userName = `${userData.first_name} ${userData.last_name}`

    // Create notification in database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNo,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    // Send email based on type
    let emailTemplate

    switch (type) {
      case "transaction":
        emailTemplate = getTransactionEmailTemplate(
          userName,
          additionalData?.transactionType || "Transaction",
          additionalData?.amount || 0,
          additionalData?.status || "completed",
          additionalData?.reference || "",
          additionalData?.description,
        )
        break
      case "kyc":
        emailTemplate = getKYCEmailTemplate(userName, additionalData?.status || "pending", additionalData?.reason)
        break
      case "account_status":
        emailTemplate = getAccountStatusEmailTemplate(
          userName,
          additionalData?.status || "active",
          additionalData?.reason,
        )
        break
      default:
        emailTemplate = getGeneralNotificationEmailTemplate(userName, title, message)
    }

    // Send email
    await sendEmail(userData.email, emailTemplate.subject, emailTemplate.html)

    console.log(`Notification and email sent successfully to ${userData.email}`)
    return { success: true }
  } catch (error) {
    console.error("Error sending notification with email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendTransactionNotification(
  accountNo: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description?: string,
) {
  const title = `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`
  const message = `Your ${transactionType} of $${amount.toFixed(2)} has been ${status}. Reference: ${reference}`

  return sendNotificationWithEmail(accountNo, title, message, "transaction", {
    transactionType,
    amount,
    status,
    reference,
    description,
  })
}

export async function sendKYCNotification(
  accountNo: string,
  status: "approved" | "rejected" | "pending",
  reason?: string,
) {
  const title = `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`
  let message = ""

  if (status === "approved") {
    message = "Congratulations! Your KYC verification has been approved."
  } else if (status === "rejected") {
    message = `Your KYC verification has been rejected. ${reason ? `Reason: ${reason}` : ""}`
  } else {
    message = "Your KYC verification is under review."
  }

  return sendNotificationWithEmail(accountNo, title, message, "kyc", { status, reason })
}

export async function sendAccountStatusNotification(
  accountNo: string,
  status: "active" | "suspended" | "pending",
  reason?: string,
) {
  const title = `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`
  let message = ""

  if (status === "active") {
    message = "Your account has been activated."
  } else if (status === "suspended") {
    message = `Your account has been suspended. ${reason ? `Reason: ${reason}` : ""}`
  } else {
    message = "Your account is under review."
  }

  return sendNotificationWithEmail(accountNo, title, message, "account_status", { status, reason })
}
