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

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: "Welcome to IAE Bank!",
      react: WelcomeEmail({ name, email }),
    })

    if (error) {
      console.error("Error sending welcome email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}

export async function sendTransactionEmail(
  email: string,
  name: string,
  amount: number,
  transactionType: string,
  reference: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: `Transaction Confirmation - ${transactionType}`,
      react: TransactionEmail({ name, amount, transactionType, reference }),
    })

    if (error) {
      console.error("Error sending transaction email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending transaction email:", error)
    return { success: false, error }
  }
}

export async function sendKYCEmail(email: string, name: string, kycStatus: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: `KYC Status Update - ${kycStatus.toUpperCase()}`,
      react: KYCEmail({ name, kycStatus }),
    })

    if (error) {
      console.error("Error sending KYC email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending KYC email:", error)
    return { success: false, error }
  }
}

export async function sendAccountEmail(email: string, name: string, accountNumber: string, message: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: "Account Update Notification",
      react: AccountEmail({ name, accountNumber, message }),
    })

    if (error) {
      console.error("Error sending account email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending account email:", error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: "Password Reset Request",
      react: PasswordResetEmail({ name, resetLink }),
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error }
  }
}

export async function sendGeneralNotificationEmail(email: string, name: string, title: string, message: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "IAE Bank <noreply@iaebank.com>",
      to: [email],
      subject: title,
      react: GeneralNotificationEmail({ name, title, message }),
    })

    if (error) {
      console.error("Error sending notification email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return { success: false, error }
  }
}
