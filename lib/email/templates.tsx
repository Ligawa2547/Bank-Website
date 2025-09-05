export const getTransactionEmailTemplate = (
  userName: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) => {
  const statusColor = status === "completed" ? "#10B981" : status === "pending" ? "#F59E0B" : "#EF4444"
  const statusText = status.charAt(0).toUpperCase() + status.slice(1)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction ${statusText}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0A3D62 0%, #0F5585 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">IAE Bank</h1>
        <p style="color: #E3F2FD; margin: 10px 0 0 0;">Transaction Notification</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #0A3D62; margin-top: 0;">Hello ${userName},</h2>
        
        <p>Your transaction has been processed with the following details:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Transaction Type:</td>
              <td style="padding: 8px 0; text-transform: capitalize;">${transactionType.replace(/_/g, " ")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount:</td>
              <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #0A3D62;">$${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${statusText}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Reference:</td>
              <td style="padding: 8px 0; font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px;">${reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Description:</td>
              <td style="padding: 8px 0;">${description}</td>
            </tr>
          </table>
        </div>
        
        ${
          status === "completed"
            ? '<p style="color: #10B981; font-weight: bold;">✅ Your transaction has been completed successfully.</p>'
            : status === "pending"
              ? '<p style="color: #F59E0B; font-weight: bold;">⏳ Your transaction is being processed and will be completed shortly.</p>'
              : '<p style="color: #EF4444; font-weight: bold;">❌ Your transaction has failed. Please contact support if you need assistance.</p>'
        }
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            If you have any questions about this transaction, please contact our support team.
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>IAE Bank Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 IAE Bank. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export const getKYCStatusEmailTemplate = (userName: string, status: string, rejectionReason?: string) => {
  const statusColor = status === "approved" ? "#10B981" : status === "pending" ? "#F59E0B" : "#EF4444"
  const statusText = status.charAt(0).toUpperCase() + status.slice(1)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC Verification ${statusText}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0A3D62 0%, #0F5585 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">IAE Bank</h1>
        <p style="color: #E3F2FD; margin: 10px 0 0 0;">KYC Verification Update</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #0A3D62; margin-top: 0;">Hello ${userName},</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: ${statusColor};">
            KYC Verification ${statusText}
          </h3>
          
          ${
            status === "approved"
              ? `
            <div style="color: #10B981; font-size: 48px; margin: 20px 0;">✅</div>
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Congratulations!</p>
            <p>Your identity verification has been successfully completed. You now have full access to all banking features including:</p>
            <ul style="text-align: left; color: #555; margin: 20px 0;">
              <li>Higher transaction limits</li>
              <li>International transfers</li>
              <li>Loan applications</li>
              <li>Investment services</li>
              <li>Premium support</li>
            </ul>
          `
              : status === "pending"
                ? `
            <div style="color: #F59E0B; font-size: 48px; margin: 20px 0;">⏳</div>
            <p style="font-size: 18px; font-weight: bold; color: #F59E0B;">Under Review</p>
            <p>Your KYC verification is currently being reviewed by our team. This process typically takes 1-3 business days.</p>
            <p>We'll notify you as soon as the review is complete.</p>
          `
                : `
            <div style="color: #EF4444; font-size: 48px; margin: 20px 0;">❌</div>
            <p style="font-size: 18px; font-weight: bold; color: #EF4444;">Verification Rejected</p>
            <p>Unfortunately, your KYC verification could not be approved at this time.</p>
            ${
              rejectionReason
                ? `
              <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; color: #DC2626; font-weight: bold;">Reason:</p>
                <p style="margin: 5px 0 0 0; color: #DC2626;">${rejectionReason}</p>
              </div>
            `
                : ""
            }
            <p>You can resubmit your documents with the required corrections through your dashboard.</p>
          `
          }
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc" 
             style="background: #0A3D62; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View KYC Status
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            If you have any questions about your KYC verification, please contact our support team.
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>IAE Bank Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 IAE Bank. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export const getAccountStatusEmailTemplate = (userName: string, status: string, reason?: string) => {
  const statusColor = status === "active" ? "#10B981" : status === "suspended" ? "#EF4444" : "#F59E0B"
  const statusText = status.charAt(0).toUpperCase() + status.slice(1)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0A3D62 0%, #0F5585 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">IAE Bank</h1>
        <p style="color: #E3F2FD; margin: 10px 0 0 0;">Account Status Update</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #0A3D62; margin-top: 0;">Hello ${userName},</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor}; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: ${statusColor};">
            Account ${statusText}
          </h3>
          
          ${
            status === "active"
              ? `
            <div style="color: #10B981; font-size: 48px; margin: 20px 0;">✅</div>
            <p style="font-size: 18px; font-weight: bold; color: #10B981;">Account Activated</p>
            <p>Your account has been successfully activated. You now have full access to all banking services.</p>
          `
              : status === "suspended"
                ? `
            <div style="color: #EF4444; font-size: 48px; margin: 20px 0;">⚠️</div>
            <p style="font-size: 18px; font-weight: bold; color: #EF4444;">Account Suspended</p>
            <p>Your account has been temporarily suspended. Please contact our support team for assistance.</p>
            ${
              reason
                ? `
              <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; color: #DC2626; font-weight: bold;">Reason:</p>
                <p style="margin: 5px 0 0 0; color: #DC2626;">${reason}</p>
              </div>
            `
                : ""
            }
          `
                : `
            <div style="color: #F59E0B; font-size: 48px; margin: 20px 0;">⏳</div>
            <p style="font-size: 18px; font-weight: bold; color: #F59E0B;">Account Status Updated</p>
            <p>Your account status has been updated to: <strong>${statusText}</strong></p>
          `
          }
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #0A3D62; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Access Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            If you have any questions about your account status, please contact our support team.
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>IAE Bank Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 IAE Bank. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export const getGeneralNotificationEmailTemplate = (
  userName: string,
  title: string,
  message: string,
  type = "info",
) => {
  const typeColor =
    type === "success" ? "#10B981" : type === "warning" ? "#F59E0B" : type === "error" ? "#EF4444" : "#0A3D62"
  const typeIcon = type === "success" ? "✅" : type === "warning" ? "⚠️" : type === "error" ? "❌" : "ℹ️"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0A3D62 0%, #0F5585 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">IAE Bank</h1>
        <p style="color: #E3F2FD; margin: 10px 0 0 0;">Notification</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #0A3D62; margin-top: 0;">Hello ${userName},</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${typeColor}; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">${typeIcon}</span>
            <h3 style="margin: 0; color: ${typeColor};">${title}</h3>
          </div>
          <p style="margin: 0; color: #555; line-height: 1.6;">${message}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #0A3D62; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>IAE Bank Team</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© 2024 IAE Bank. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}
