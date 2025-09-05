export interface EmailTemplate {
  subject: string
  html: string
}

export function getTransactionEmailTemplate(
  userName: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description?: string,
): EmailTemplate {
  const statusColor = status === "completed" ? "#10B981" : status === "failed" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "completed" ? "✅" : status === "failed" ? "❌" : "⏳"

  return {
    subject: `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)} - ${reference}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transaction Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Transaction Update</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
                <h2 style="color: ${statusColor}; margin: 0; font-size: 24px; font-weight: bold;">
                  Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}
                </h2>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello ${userName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Your ${transactionType} transaction has been ${status}. Here are the details:
              </p>
              
              <!-- Transaction Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Transaction Type:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${transactionType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Amount:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">$${amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reference:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${reference}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                    <td style="padding: 8px 0; color: ${statusColor}; font-weight: 600; text-align: right;">${status.charAt(0).toUpperCase() + status.slice(1)}</td>
                  </tr>
                  ${
                    description
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Description:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${description}</td>
                  </tr>
                  `
                      : ""
                  }
                </table>
              </div>
              
              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  View Transaction Details
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                If you have any questions about this transaction, please contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 IAE Bank. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getKYCEmailTemplate(
  userName: string,
  status: "approved" | "rejected" | "pending",
  reason?: string,
): EmailTemplate {
  const statusColor = status === "approved" ? "#10B981" : status === "rejected" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "approved" ? "✅" : status === "rejected" ? "❌" : "⏳"

  let message = ""
  let actionText = ""

  if (status === "approved") {
    message =
      "Congratulations! Your KYC verification has been approved. You now have full access to all banking features."
    actionText = "Access Your Account"
  } else if (status === "rejected") {
    message = `Your KYC verification has been rejected. ${reason ? `Reason: ${reason}` : "Please review your documents and resubmit."}`
    actionText = "Resubmit Documents"
  } else {
    message = "Your KYC verification is currently under review. We will notify you once the review is complete."
    actionText = "Check Status"
  }

  return {
    subject: `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYC Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">KYC Verification Update</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
                <h2 style="color: ${statusColor}; margin: 0; font-size: 24px; font-weight: bold;">
                  KYC ${status.charAt(0).toUpperCase() + status.slice(1)}
                </h2>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello ${userName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${message}
              </p>
              
              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  ${actionText}
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                If you have any questions about your KYC verification, please contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 IAE Bank. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getAccountStatusEmailTemplate(
  userName: string,
  status: "active" | "suspended" | "pending",
  reason?: string,
): EmailTemplate {
  const statusColor = status === "active" ? "#10B981" : status === "suspended" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "active" ? "✅" : status === "suspended" ? "⚠️" : "⏳"

  let message = ""
  let actionText = ""

  if (status === "active") {
    message = "Your account has been activated and you now have full access to all banking services."
    actionText = "Access Your Account"
  } else if (status === "suspended") {
    message = `Your account has been suspended. ${reason ? `Reason: ${reason}` : "Please contact support for more information."}`
    actionText = "Contact Support"
  } else {
    message = "Your account is currently under review. We will notify you once the review is complete."
    actionText = "Check Status"
  }

  return {
    subject: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Account Status Update</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
                <h2 style="color: ${statusColor}; margin: 0; font-size: 24px; font-weight: bold;">
                  Account ${status.charAt(0).toUpperCase() + status.slice(1)}
                </h2>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello ${userName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${message}
              </p>
              
              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  ${actionText}
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                If you have any questions about your account status, please contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 IAE Bank. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function getGeneralNotificationEmailTemplate(userName: string, title: string, message: string): EmailTemplate {
  return {
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Notification</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📢</div>
                <h2 style="color: #374151; margin: 0; font-size: 24px; font-weight: bold;">
                  ${title}
                </h2>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                Hello ${userName},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                ${message}
              </p>
              
              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Go to Dashboard
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                If you have any questions, please contact our support team.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 IAE Bank. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
