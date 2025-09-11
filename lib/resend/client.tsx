import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const EMAIL_CONFIG = {
  from: "IAE Bank <noreply@iaebank.com>",
  replyTo: "support@iaebank.com",
} as const

// Email sending utility with error handling
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    console.log("✅ Email sent successfully:", result)
    return { success: true, data: result }
  } catch (error) {
    console.error("❌ Failed to send email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Batch email sending utility
export async function sendBatchEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
    text?: string
  }>,
) {
  const results = []

  for (const email of emails) {
    const result = await sendEmail(email)
    results.push(result)

    // Add small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

// Email validation utility
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Email template wrapper
export function wrapEmailTemplate(content: string, title = "IAE Bank") {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #1e40af;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1e40af;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
        }
        .alert {
          padding: 16px;
          border-radius: 6px;
          margin: 16px 0;
        }
        .alert-info {
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          color: #1e40af;
        }
        .alert-success {
          background-color: #dcfce7;
          border-left: 4px solid #22c55e;
          color: #166534;
        }
        .alert-warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">IAE Bank</div>
        <p style="margin: 5px 0 0 0; color: #6b7280;">Your Trusted Banking Partner</p>
      </div>
      
      ${content}
      
      <div class="footer">
        <p><strong>IAE Bank</strong></p>
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>If you have questions, contact us at <a href="mailto:support@iaebank.com">support@iaebank.com</a></p>
        <p style="margin-top: 20px; font-size: 12px;">
          © ${new Date().getFullYear()} IAE Bank. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `
}

// Test the connection
export async function testResendConnection() {
  try {
    console.log("🔄 Testing Resend connection...")

    // Test with a simple API call
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: ["test@example.com"],
      subject: "Resend Connection Test",
      html: wrapEmailTemplate("<p>This is a test email to verify Resend connection.</p>", "Resend Connection Test"),
    })

    console.log("✅ Resend connection successful:", result.data?.id)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error("❌ Resend connection failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
