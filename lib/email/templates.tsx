interface EmailTemplateProps {
  title: string
  content: string
  actionUrl?: string
  actionText?: string
  footerText?: string
}

export function getEmailTemplate({ title, content, actionUrl, actionText, footerText }: EmailTemplateProps): string {
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
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .content h2 {
          color: #1f2937;
          margin-top: 0;
          font-size: 20px;
        }
        .content p {
          margin-bottom: 16px;
          color: #4b5563;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background: #f9fafb;
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          border-top: 1px solid #e5e7eb;
        }
        .transaction-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .transaction-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .transaction-details td {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .transaction-details td:first-child {
          font-weight: 600;
          color: #374151;
          width: 40%;
        }
        .transaction-details td:last-child {
          color: #6b7280;
        }
        .status-success {
          color: #059669;
          font-weight: 600;
        }
        .status-pending {
          color: #d97706;
          font-weight: 600;
        }
        .status-failed {
          color: #dc2626;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>IAE Bank</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
          ${actionUrl && actionText ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ""}
        </div>
        <div class="footer">
          ${footerText || "Thank you for banking with IAE Bank. If you have any questions, please contact our support team."}
          <br><br>
          <strong>IAE Bank</strong><br>
          Your trusted financial partner
        </div>
      </div>
    </body>
    </html>
  `
}

export function getTransactionEmailTemplate(
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
): string {
  const statusClass =
    status === "completed" ? "status-success" : status === "pending" ? "status-pending" : "status-failed"
  const statusText = status === "completed" ? "Completed" : status === "pending" ? "Pending" : "Failed"

  const title = `Transaction ${statusText}`
  const content = `
    <p>Your ${transactionType.toLowerCase()} transaction has been ${status}.</p>
    <div class="transaction-details">
      <table>
        <tr>
          <td>Transaction Type:</td>
          <td>${transactionType}</td>
        </tr>
        <tr>
          <td>Amount:</td>
          <td><strong>$${amount.toFixed(2)} USD</strong></td>
        </tr>
        <tr>
          <td>Status:</td>
          <td><span class="${statusClass}">${statusText}</span></td>
        </tr>
        <tr>
          <td>Reference:</td>
          <td>${reference}</td>
        </tr>
        <tr>
          <td>Description:</td>
          <td>${description}</td>
        </tr>
        <tr>
          <td>Date:</td>
          <td>${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
    ${status === "completed" ? "<p>Your account balance has been updated accordingly.</p>" : ""}
  `

  return getEmailTemplate({
    title,
    content,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions`,
    actionText: "View Transaction History",
  })
}

export function getKYCEmailTemplate(status: string, reason?: string): string {
  const isApproved = status === "approved"
  const title = `KYC Verification ${isApproved ? "Approved" : "Update"}`

  let content = ""
  if (isApproved) {
    content = `
      <p>Congratulations! Your KYC verification has been approved.</p>
      <p>You now have full access to all banking features including:</p>
      <ul>
        <li>Higher transaction limits</li>
        <li>International transfers</li>
        <li>Loan applications</li>
        <li>Investment products</li>
      </ul>
      <p>Thank you for completing the verification process.</p>
    `
  } else if (status === "rejected") {
    content = `
      <p>We regret to inform you that your KYC verification has been rejected.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>Please review the requirements and resubmit your documents. If you have any questions, please contact our support team.</p>
    `
  } else {
    content = `
      <p>Your KYC verification status has been updated to: <strong>${status}</strong></p>
      ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
      <p>We will notify you once the review process is complete.</p>
    `
  }

  return getEmailTemplate({
    title,
    content,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc`,
    actionText: "View KYC Status",
  })
}

export function getAccountStatusEmailTemplate(status: string, reason?: string): string {
  const isActive = status === "active"
  const title = `Account ${isActive ? "Activated" : "Status Update"}`

  let content = ""
  if (isActive) {
    content = `
      <p>Great news! Your account has been activated.</p>
      <p>You can now access all banking services and features.</p>
      <p>Welcome to IAE Bank!</p>
    `
  } else if (status === "suspended") {
    content = `
      <p>Your account has been temporarily suspended.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>Please contact our support team to resolve this issue and reactivate your account.</p>
    `
  } else {
    content = `
      <p>Your account status has been updated to: <strong>${status}</strong></p>
      ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
      <p>If you have any questions about this change, please contact our support team.</p>
    `
  }

  return getEmailTemplate({
    title,
    content,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    actionText: "Access Dashboard",
  })
}

export function getGeneralNotificationEmailTemplate(title: string, message: string): string {
  return getEmailTemplate({
    title,
    content: `<p>${message}</p>`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/notifications`,
    actionText: "View All Notifications",
  })
}
