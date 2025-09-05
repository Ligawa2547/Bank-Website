import { createClient } from "@/lib/supabase/client"
import { sendEmail } from "@/lib/resend/client"
import {
  getTransactionEmailTemplate,
  getKYCStatusEmailTemplate,
  getAccountStatusEmailTemplate,
  getGeneralNotificationEmailTemplate,
} from "./templates"

const supabase = createClient()

export const sendTransactionEmail = async (
  userEmail: string,
  userName: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) => {
  try {
    const subject = `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)} - ${reference}`
    const html = getTransactionEmailTemplate(userName, transactionType, amount, status, reference, description)

    await sendEmail({
      to: userEmail,
      subject,
      html,
    })

    console.log(`Transaction email sent to ${userEmail}`)
  } catch (error) {
    console.error("Failed to send transaction email:", error)
  }
}

export const sendKYCStatusEmail = async (
  userEmail: string,
  userName: string,
  status: string,
  rejectionReason?: string,
) => {
  try {
    const subject = `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)} - IAE Bank`
    const html = getKYCStatusEmailTemplate(userName, status, rejectionReason)

    await sendEmail({
      to: userEmail,
      subject,
      html,
    })

    console.log(`KYC status email sent to ${userEmail}`)
  } catch (error) {
    console.error("Failed to send KYC status email:", error)
  }
}

export const sendAccountStatusEmail = async (userEmail: string, userName: string, status: string, reason?: string) => {
  try {
    const subject = `Account ${status.charAt(0).toUpperCase() + status.slice(1)} - IAE Bank`
    const html = getAccountStatusEmailTemplate(userName, status, reason)

    await sendEmail({
      to: userEmail,
      subject,
      html,
    })

    console.log(`Account status email sent to ${userEmail}`)
  } catch (error) {
    console.error("Failed to send account status email:", error)
  }
}

export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  title: string,
  message: string,
  type = "info",
) => {
  try {
    const subject = `${title} - IAE Bank`
    const html = getGeneralNotificationEmailTemplate(userName, title, message, type)

    await sendEmail({
      to: userEmail,
      subject,
      html,
    })

    console.log(`General notification email sent to ${userEmail}`)
  } catch (error) {
    console.error("Failed to send general notification email:", error)
  }
}

// Helper function to get user details by account number
export const getUserByAccountNumber = async (accountNumber: string) => {
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
export const getUserById = async (userId: string) => {
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
