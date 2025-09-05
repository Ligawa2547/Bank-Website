import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({
  to,
  subject,
  html,
  from = "IAE Bank <noreply@iaenb.com>",
}: {
  to: string
  subject: string
  html: string
  from?: string
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Error sending email:", error)
      throw error
    }

    console.log("Email sent successfully:", data)
    return data
  } catch (error) {
    console.error("Failed to send email:", error)
    throw error
  }
}
