export const getTransactionEmailTemplate = (
  userName: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) => {
  const statusColor = status === "completed" ? "#10B981" : status === "failed" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "completed" ? "✅" : status === "failed" ? "❌" : "⏳"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">IAE Bank</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Your trusted banking partner</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
            <h2 style="color: ${statusColor}; margin: 0; font-size: 28px;">Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Dear ${userName},
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Your ${transactionType.replace(/_/g, " ")} transaction has been ${status}. Here are the details:
          </p>
          
          <!-- Transaction Details -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Transaction Type:</td>
                <td style="padding: 8px 0; color: #333; text-align: right; text-transform: capitalize;">${transactionType.replace(/_/g, " ")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Amount:</td>
                <td style="padding: 8px 0; color: #333; text-align: right; font-weight: 600; font-size: 18px;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Status:</td>
                <td style="padding: 8px 0; color: ${statusColor}; text-align: right; font-weight: 600; text-transform: capitalize;">${status}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Reference:</td>
                <td style="padding: 8px 0; color: #333; text-align: right; font-family: monospace;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Description:</td>
                <td style="padding: 8px 0; color: #333; text-align: right;">${description}</td>
              </tr>
            </table>
          </div>
          
          ${
            status === "completed"
              ? `
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">✅ Your transaction has been processed successfully!</p>
            </div>
          `
              : status === "failed"
                ? `
            <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="color: #991b1b; margin: 0; font-weight: 500;">❌ Your transaction could not be processed. Please contact support if you need assistance.</p>
            </div>
          `
                : `
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">⏳ Your transaction is being processed. We'll notify you once it's complete.</p>
            </div>
          `
          }
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View Transaction History</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const getKYCStatusEmailTemplate = (userName: string, status: string, rejectionReason?: string) => {
  const statusColor = status === "approved" ? "#10B981" : status === "rejected" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "approved" ? "✅" : status === "rejected" ? "❌" : "⏳"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KYC ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">IAE Bank</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">KYC Verification Update</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
            <h2 style="color: ${statusColor}; margin: 0; font-size: 28px;">KYC ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Dear ${userName},
          </p>
          
          ${
            status === "approved"
              ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Congratulations! Your KYC (Know Your Customer) verification has been successfully approved.
            </p>
            
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">🎉 You now have access to:</h3>
              <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Full banking services</li>
                <li style="margin-bottom: 8px;">Higher transaction limits</li>
                <li style="margin-bottom: 8px;">Loan applications</li>
                <li style="margin-bottom: 8px;">Investment products</li>
                <li>Premium customer support</li>
              </ul>
            </div>
          `
              : status === "rejected"
                ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We regret to inform you that your KYC verification has been rejected.
            </p>
            
            ${
              rejectionReason
                ? `
              <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Rejection Reason:</h3>
                <p style="color: #991b1b; margin: 0;">${rejectionReason}</p>
              </div>
            `
                : ""
            }
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Next Steps:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Review the rejection reason above</li>
                <li style="margin-bottom: 8px;">Prepare the required documents</li>
                <li style="margin-bottom: 8px;">Resubmit your KYC application</li>
                <li>Contact support if you need assistance</li>
              </ul>
            </div>
          `
                : `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your KYC verification status has been updated to: <strong style="color: ${statusColor};">${status}</strong>
            </p>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">⏳ Your application is being reviewed. We'll notify you once the process is complete.</p>
            </div>
          `
          }
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View KYC Status</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const getAccountStatusEmailTemplate = (userName: string, status: string, reason?: string) => {
  const statusColor = status === "active" ? "#10B981" : status === "suspended" ? "#EF4444" : "#F59E0B"
  const statusIcon = status === "active" ? "✅" : status === "suspended" ? "⚠️" : "ℹ️"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account ${status.charAt(0).toUpperCase() + status.slice(1)}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">IAE Bank</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Account Status Update</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
            <h2 style="color: ${statusColor}; margin: 0; font-size: 28px;">Account ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Dear ${userName},
          </p>
          
          ${
            status === "active"
              ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Great news! Your account has been reactivated and you now have full access to all banking features.
            </p>
            
            <div style="background-color: #d1fae5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">✅ You can now:</h3>
              <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Make transactions and transfers</li>
                <li style="margin-bottom: 8px;">Access all account features</li>
                <li style="margin-bottom: 8px;">Apply for loans and services</li>
                <li>Use mobile and online banking</li>
              </ul>
            </div>
          `
              : status === "suspended"
                ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              We regret to inform you that your account has been temporarily suspended.
            </p>
            
            ${
              reason
                ? `
              <div style="background-color: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Reason for Suspension:</h3>
                <p style="color: #991b1b; margin: 0;">${reason}</p>
              </div>
            `
                : ""
            }
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
              <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">What this means:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Temporary restriction on account access</li>
                <li style="margin-bottom: 8px;">Limited transaction capabilities</li>
                <li style="margin-bottom: 8px;">Contact support to resolve the issue</li>
                <li>Account will be reviewed for reactivation</li>
              </ul>
            </div>
          `
                : `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your account status has been updated to: <strong style="color: ${statusColor};">${status}</strong>
            </p>
            
            ${
              reason
                ? `
              <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 18px;">Additional Information:</h3>
                <p style="color: #495057; margin: 0;">${reason}</p>
              </div>
            `
                : ""
            }
          `
          }
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Access Dashboard</a>
          </div>
          
          ${
            status === "suspended"
              ? `
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/support" style="background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Contact Support</a>
            </div>
          `
              : ""
          }
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
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
    type === "success" ? "#10B981" : type === "error" ? "#EF4444" : type === "warning" ? "#F59E0B" : "#3B82F6"
  const typeIcon = type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">IAE Bank</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Important Notification</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">${typeIcon}</div>
            <h2 style="color: ${typeColor}; margin: 0; font-size: 24px;">${title}</h2>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Dear ${userName},
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid ${typeColor}; padding: 25px; margin-bottom: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
              ${message}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Access Dashboard</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This is an automated message from IAE Bank. Please do not reply to this email.
          </p>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
