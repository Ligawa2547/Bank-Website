import { Resend } from "resend"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from = "IAE Bank <noreply@iaebank.com>" }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      throw new Error("Email service is not configured")
    }

    console.log(`Sending email to ${to} with subject: ${subject}`)

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend error:", error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log("Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export { resend }
