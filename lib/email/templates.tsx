export function getTransactionEmailTemplate(
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
): string {
  const statusColor = status === "completed" ? "#10B981" : status === "failed" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "completed" ? "✅" : status === "failed" ? "❌" : "⏳"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction ${status}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your trusted banking partner</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">${statusIcon}</div>
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          </div>
          
          <!-- Transaction Details -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Transaction Type:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right; text-transform: capitalize;">${transactionType.replace("_", " ")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Amount:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right; font-size: 18px;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                <td style="padding: 8px 0; text-align: right;">
                  <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                    ${status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Reference:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right; font-family: monospace;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Description:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${description}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937; text-align: right;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              View Transaction History
            </a>
          </div>
          
          <!-- Message -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              ${
                status === "completed"
                  ? "Your transaction has been processed successfully. The amount has been updated in your account balance."
                  : status === "failed"
                    ? "Your transaction could not be processed. Please contact support if you need assistance."
                    : "Your transaction is being processed. You will receive another notification once it is completed."
              }
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getKYCStatusEmailTemplate(userName: string, status: string, reason?: string): string {
  const isApproved = status === "approved"
  const statusColor = isApproved ? "#10B981" : "#EF4444"
  const statusIcon = isApproved ? "✅" : "❌"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC ${status}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your trusted banking partner</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">${statusIcon}</div>
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">KYC Verification ${isApproved ? "Approved" : "Update"}</h2>
          </div>
          
          <!-- Status Message -->
          <div style="background-color: ${isApproved ? "#ecfdf5" : "#fef2f2"}; border-left: 4px solid ${statusColor}; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h3 style="margin: 0 0 10px 0; color: ${statusColor}; font-size: 18px;">
              ${isApproved ? "Congratulations!" : "Action Required"}
            </h3>
            <p style="margin: 0; color: #1f2937; line-height: 1.6;">
              ${
                isApproved
                  ? `Hello ${userName}, your KYC verification has been approved! You now have full access to all banking features including transfers, deposits, and withdrawals.`
                  : `Hello ${userName}, your KYC verification has been ${status}. ${reason ? `Reason: ${reason}` : "Please review your documents and resubmit if necessary."}`
              }
            </p>
          </div>
          
          ${
            !isApproved && reason
              ? `
          <!-- Reason Details -->
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626;">Reason for ${status}:</h4>
            <p style="margin: 0; color: #1f2937;">${reason}</p>
          </div>
          `
              : ""
          }
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              ${isApproved ? "Access Dashboard" : "Update KYC Documents"}
            </a>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #1e40af;">Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
              ${
                isApproved
                  ? `
                <li style="margin-bottom: 8px;">You can now make deposits and withdrawals</li>
                <li style="margin-bottom: 8px;">Transfer funds to other accounts</li>
                <li style="margin-bottom: 8px;">Access all premium banking features</li>
                <li>Enjoy secure and fast transactions</li>
              `
                  : `
                <li style="margin-bottom: 8px;">Review the reason for ${status}</li>
                <li style="margin-bottom: 8px;">Update your documents if necessary</li>
                <li style="margin-bottom: 8px;">Resubmit your KYC application</li>
                <li>Contact support if you need assistance</li>
              `
              }
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getAccountStatusEmailTemplate(userName: string, status: string, reason?: string): string {
  const isActive = status === "active"
  const statusColor = isActive ? "#10B981" : "#EF4444"
  const statusIcon = isActive ? "✅" : "⚠️"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account ${status}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your trusted banking partner</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">${statusIcon}</div>
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">Account ${isActive ? "Activated" : "Status Update"}</h2>
          </div>
          
          <!-- Status Message -->
          <div style="background-color: ${isActive ? "#ecfdf5" : "#fef2f2"}; border-left: 4px solid ${statusColor}; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 16px;">
              ${
                isActive
                  ? `Hello ${userName}, welcome to IAE Bank! Your account has been successfully activated and you now have full access to all our banking services.`
                  : `Hello ${userName}, your account status has been updated to "${status}". ${reason ? `Reason: ${reason}` : "Please contact our support team for more information."}`
              }
            </p>
          </div>
          
          ${
            reason && !isActive
              ? `
          <!-- Reason Details -->
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626;">Reason:</h4>
            <p style="margin: 0; color: #1f2937;">${reason}</p>
          </div>
          `
              : ""
          }
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              ${isActive ? "Access Your Dashboard" : "Contact Support"}
            </a>
          </div>
          
          <!-- Information -->
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #1e40af;">${isActive ? "What You Can Do Now:" : "Need Help?"}</h4>
            <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
              ${
                isActive
                  ? `
                <li style="margin-bottom: 8px;">View your account balance and transaction history</li>
                <li style="margin-bottom: 8px;">Make deposits and withdrawals</li>
                <li style="margin-bottom: 8px;">Transfer money to other accounts</li>
                <li>Access all premium banking features</li>
              `
                  : `
                <li style="margin-bottom: 8px;">Contact our support team for assistance</li>
                <li style="margin-bottom: 8px;">Review your account status in the dashboard</li>
                <li style="margin-bottom: 8px;">Provide any additional documentation if required</li>
                <li>Follow up on any pending requirements</li>
              `
              }
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getGeneralNotificationEmailTemplate(
  userName: string,
  title: string,
  message: string,
  type = "info",
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IAE Bank</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your trusted banking partner</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 15px;">📢</div>
            <h2 style="color: #1f2937; margin: 0; font-size: 24px;">${title}</h2>
          </div>
          
          <!-- Message -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 16px;">
              Hello ${userName}, ${message}
            </p>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Access Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
