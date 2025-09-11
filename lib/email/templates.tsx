import { wrapEmailTemplate } from "@/lib/resend/client"

export interface WelcomeEmailData {
  userName: string
  userEmail: string
}

export interface PasswordResetEmailData {
  userName: string
  resetLink: string
}

export interface KYCStatusEmailData {
  userName: string
  status: "approved" | "rejected" | "pending"
  reason?: string
}

export interface AccountStatusEmailData {
  userName: string
  status: "active" | "suspended" | "closed"
  reason?: string
}

export function generateWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const { userName, userEmail } = data

  const content = `
    <div style="text-align: center; margin: 40px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
      <h1 style="color: #1e40af; font-size: 32px; margin-bottom: 16px;">Welcome to IAE Bank!</h1>
      <p style="font-size: 18px; color: #4b5563; margin-bottom: 30px;">
        Thank you for choosing IAE Bank as your trusted financial partner.
      </p>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 30px 0;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Getting Started</h2>
      <div style="space-y: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</span>
          <span>Complete your KYC verification to unlock all features</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">2</span>
          <span>Set up your profile and security preferences</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span style="background: #8b5cf6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">3</span>
          <span>Start using our banking services</span>
        </div>
      </div>
    </div>

    <div style="background: #dbeafe; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1e40af; margin-bottom: 12px;">Your Account Details</h3>
      <p style="margin: 8px 0; color: #1e293b;"><strong>Email:</strong> ${userEmail}</p>
      <p style="margin: 8px 0; color: #1e293b;"><strong>Account Type:</strong> Personal Banking</p>
      <p style="margin: 8px 0; color: #1e293b;"><strong>Status:</strong> Active</p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
         style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Access Your Dashboard
      </a>
    </div>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #374151; margin-bottom: 12px;">Need Help?</h3>
      <p style="color: #6b7280; margin-bottom: 16px;">
        Our support team is here to help you get the most out of your IAE Bank experience.
      </p>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <a href="mailto:support@iaebank.com" style="color: #1e40af; text-decoration: none;">📧 Email Support</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #1e40af; text-decoration: none;">💬 Live Chat</a>
        <a href="tel:+1-800-IAE-BANK" style="color: #1e40af; text-decoration: none;">📞 Call Us</a>
      </div>
    </div>
  `

  const html = wrapEmailTemplate(content, "Welcome to IAE Bank")
  const text = `Welcome to IAE Bank!

Hello ${userName},

Thank you for choosing IAE Bank as your trusted financial partner.

Getting Started:
1. Complete your KYC verification to unlock all features
2. Set up your profile and security preferences  
3. Start using our banking services

Your Account Details:
- Email: ${userEmail}
- Account Type: Personal Banking
- Status: Active

Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Need help? Contact us:
- Email: support@iaebank.com
- Live Chat: ${process.env.NEXT_PUBLIC_APP_URL}/support
- Phone: +1-800-IAE-BANK

Best regards,
The IAE Bank Team`

  return { html, text }
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): { html: string; text: string } {
  const { userName, resetLink } = data

  const content = `
    <div style="text-align: center; margin: 40px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">🔐</div>
      <h1 style="color: #1e40af; font-size: 28px; margin-bottom: 16px;">Password Reset Request</h1>
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
        We received a request to reset your password for your IAE Bank account.
      </p>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="font-size: 20px;">⚠️</span>
        <strong style="color: #92400e;">Security Notice</strong>
      </div>
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <p style="color: #374151; margin-bottom: 24px;">
        Click the button below to reset your password. This link will expire in 1 hour.
      </p>
      <a href="${resetLink}" 
         style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset My Password
      </a>
    </div>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #374151; margin-bottom: 12px;">Security Tips</h3>
      <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
        <li>Use a strong, unique password for your banking account</li>
        <li>Never share your password with anyone</li>
        <li>Enable two-factor authentication for extra security</li>
        <li>Log out of your account when using shared computers</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0; padding: 20px; background: #fee2e2; border-radius: 8px;">
      <p style="color: #dc2626; margin: 0; font-size: 14px;">
        <strong>Having trouble?</strong> Contact our support team at 
        <a href="mailto:support@iaebank.com" style="color: #dc2626;">support@iaebank.com</a>
      </p>
    </div>
  `

  const html = wrapEmailTemplate(content, "Password Reset - IAE Bank")
  const text = `Password Reset Request

Hello ${userName},

We received a request to reset your password for your IAE Bank account.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

To reset your password, click the following link (expires in 1 hour):
${resetLink}

Security Tips:
- Use a strong, unique password for your banking account
- Never share your password with anyone
- Enable two-factor authentication for extra security
- Log out of your account when using shared computers

Having trouble? Contact our support team at support@iaebank.com

Best regards,
The IAE Bank Team`

  return { html, text }
}

export function generateKYCStatusEmail(data: KYCStatusEmailData): { html: string; text: string } {
  const { userName, status, reason } = data

  const statusConfig = {
    approved: {
      icon: "✅",
      color: "#22c55e",
      bgColor: "#dcfce7",
      title: "KYC Verification Approved",
      message: "Congratulations! Your identity verification has been approved.",
    },
    rejected: {
      icon: "❌",
      color: "#ef4444",
      bgColor: "#fee2e2",
      title: "KYC Verification Requires Attention",
      message: "We need additional information to complete your verification.",
    },
    pending: {
      icon: "⏳",
      color: "#f59e0b",
      bgColor: "#fef3c7",
      title: "KYC Verification In Progress",
      message: "We are currently reviewing your submitted documents.",
    },
  }

  const config = statusConfig[status]

  const content = `
    <div style="text-align: center; margin: 40px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">${config.icon}</div>
      <h1 style="color: ${config.color}; font-size: 28px; margin-bottom: 16px;">${config.title}</h1>
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">
        ${config.message}
      </p>
    </div>

    <div style="background: ${config.bgColor}; border: 1px solid ${config.color}; border-radius: 8px; padding: 24px; margin: 30px 0;">
      <h3 style="color: ${config.color}; margin-bottom: 16px;">Status Update</h3>
      <p style="color: #374151; margin-bottom: 12px;">
        <strong>Account:</strong> ${userName}
      </p>
      <p style="color: #374151; margin-bottom: 12px;">
        <strong>Verification Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}
      </p>
      <p style="color: #374151; margin-bottom: 12px;">
        <strong>Date:</strong> ${new Date().toLocaleDateString()}
      </p>
      ${
        reason
          ? `
      <p style="color: #374151; margin-bottom: 12px;">
        <strong>Additional Information:</strong> ${reason}
      </p>
      `
          : ""
      }
    </div>

    ${
      status === "approved"
        ? `
    <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #0369a1; margin-bottom: 12px;">What's Next?</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li>All banking features are now available</li>
        <li>You can make deposits and withdrawals</li>
        <li>Transfer limits have been increased</li>
        <li>Access to premium services is enabled</li>
      </ul>
    </div>
    `
        : status === "rejected"
          ? `
    <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #dc2626; margin-bottom: 12px;">Next Steps</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li>Review the feedback provided above</li>
        <li>Prepare the required documents</li>
        <li>Resubmit your verification through your dashboard</li>
        <li>Contact support if you need assistance</li>
      </ul>
    </div>
    `
          : `
    <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #d97706; margin-bottom: 12px;">What to Expect</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li>Review typically takes 1-3 business days</li>
        <li>You'll receive an email once review is complete</li>
        <li>Basic banking features remain available</li>
        <li>No action required from you at this time</li>
      </ul>
    </div>
    `
    }

    <div style="text-align: center; margin: 40px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc" 
         style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; 
                text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View KYC Status
      </a>
    </div>
  `

  const html = wrapEmailTemplate(content, `${config.title} - IAE Bank`)
  const text = `${config.title}

Hello ${userName},

${config.message}

Status Update:
- Account: ${userName}
- Verification Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
- Date: ${new Date().toLocaleDateString()}
${reason ? `- Additional Information: ${reason}` : ""}

${
  status === "approved"
    ? `
What's Next:
- All banking features are now available
- You can make deposits and withdrawals  
- Transfer limits have been increased
- Access to premium services is enabled
`
    : status === "rejected"
      ? `
Next Steps:
- Review the feedback provided above
- Prepare the required documents
- Resubmit your verification through your dashboard
- Contact support if you need assistance
`
      : `
What to Expect:
- Review typically takes 1-3 business days
- You'll receive an email once review is complete
- Basic banking features remain available
- No action required from you at this time
`
}

View your KYC status: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc

Best regards,
The IAE Bank Team`

  return { html, text }
}
