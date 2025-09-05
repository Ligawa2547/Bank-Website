import { createClient } from "@/lib/supabase/client"
import { sendEmail } from "@/lib/resend/client"
import {
  getTransactionEmailTemplate,
  getKYCStatusEmailTemplate,
  getAccountStatusEmailTemplate,
  getGeneralNotificationEmailTemplate,
} from "@/lib/email/templates"

const supabase = createClient()

// Helper function to get user details by account number
const getUserByAccountNumber = async (accountNumber: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("account_no", accountNumber)
      .single()

    if (error) {
      console.error("Error fetching user by account number:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to get user by account number:", error)
    return null
  }
}

// Helper function to get user details by user ID
const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, account_no")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Failed to get user by ID:", error)
    return null
  }
}

// Send notification to database and email
export const sendNotificationWithEmail = async (
  accountNumber: string,
  title: string,
  message: string,
  type = "info",
) => {
  try {
    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNumber,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting notification:", notificationError)
    }

    // Get user details and send email
    const user = await getUserByAccountNumber(accountNumber)
    if (user) {
      const userName = `${user.first_name} ${user.last_name}`
      const html = getGeneralNotificationEmailTemplate(userName, title, message, type)

      await sendEmail({
        to: user.email,
        subject: `${title} - IAE Bank`,
        html,
      })

      console.log(`Email notification sent to ${user.email}`)
    }

    console.log("Notification sent successfully")
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}

// Send transaction notification
export const sendTransactionNotification = async (
  accountNumber: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) => {
  try {
    const title = `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`
    const message = `Your ${transactionType.replace(/_/g, " ")} of $${amount.toFixed(2)} has been ${status}. Reference: ${reference}`

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNumber,
      title,
      message,
      type: status === "completed" ? "success" : status === "failed" ? "error" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting transaction notification:", notificationError)
    }

    // Get user details and send email
    const user = await getUserByAccountNumber(accountNumber)
    if (user) {
      const userName = `${user.first_name} ${user.last_name}`
      const html = getTransactionEmailTemplate(userName, transactionType, amount, status, reference, description)

      await sendEmail({
        to: user.email,
        subject: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)} - ${reference}`,
        html,
      })

      console.log(`Transaction email sent to ${user.email}`)
    }

    console.log("Transaction notification sent successfully")
  } catch (error) {
    console.error("Error sending transaction notification:", error)
  }
}

// Send KYC status notification
export const sendKYCStatusNotification = async (userId: string, status: string, rejectionReason?: string) => {
  try {
    const title = `KYC ${status === "approved" ? "Approved" : "Status Updated"}`
    const message =
      status === "approved"
        ? "Congratulations! Your KYC verification has been approved. You now have full access to all banking features."
        : status === "rejected"
          ? `Your KYC verification has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : "Please contact support for more information."}`
          : `Your KYC verification status has been updated to ${status}.`

    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      console.error("User not found for KYC notification")
      return
    }

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: user.account_no,
      title,
      message,
      type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting KYC notification:", notificationError)
    }

    // Send email
    const userName = `${user.first_name} ${user.last_name}`
    const html = getKYCStatusEmailTemplate(userName, status, rejectionReason)

    await sendEmail({
      to: user.email,
      subject: `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)} - IAE Bank`,
      html,
    })

    console.log(`KYC email sent to ${user.email}`)
    console.log("KYC notification sent successfully")
  } catch (error) {
    console.error("Error sending KYC notification:", error)
  }
}

// Send account status notification
export const sendAccountStatusNotification = async (userId: string, status: string, reason?: string) => {
  try {
    const title = `Account ${status === "active" ? "Activated" : "Status Updated"}`
    const message =
      status === "suspended"
        ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : "Please contact support for assistance."}`
        : status === "active"
          ? "Your account has been reactivated. You now have full access to all features."
          : `Your account status has been updated to ${status}.`

    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      console.error("User not found for account status notification")
      return
    }

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: user.account_no,
      title,
      message,
      type: status === "suspended" ? "warning" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting account status notification:", notificationError)
    }

    // Send email
    const userName = `${user.first_name} ${user.last_name}`
    const html = getAccountStatusEmailTemplate(userName, status, reason)

    await sendEmail({
      to: user.email,
      subject: `Account ${status.charAt(0).toUpperCase() + status.slice(1)} - IAE Bank`,
      html,
    })

    console.log(`Account status email sent to ${user.email}`)
    console.log("Account status notification sent successfully")
  } catch (error) {
    console.error("Error sending account status notification:", error)
  }
}
