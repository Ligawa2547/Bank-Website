interface EmailTemplateProps {
  name?: string
  email?: string
  amount?: number
  reference?: string
  transactionType?: string
  resetLink?: string
  message?: string
  title?: string
  kycStatus?: string
  accountNumber?: string
}

export function WelcomeEmail({ name, email }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#1e40af", color: "white", padding: "20px", textAlign: "center" }}>
        <h1>Welcome to IAE Bank!</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>Welcome to IAE Bank. Your account has been successfully created.</p>
        <p>You can now access all our banking services including:</p>
        <ul>
          <li>Online transfers</li>
          <li>Account statements</li>
          <li>Loan applications</li>
          <li>24/7 customer support</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}

export function TransactionEmail({ name, amount, transactionType, reference }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#10b981", color: "white", padding: "20px", textAlign: "center" }}>
        <h1>Transaction Confirmation</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>Your {transactionType?.toLowerCase()} has been successfully processed.</p>
        <div style={{ backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "5px", margin: "20px 0" }}>
          <p>
            <strong>Transaction Type:</strong> {transactionType}
          </p>
          <p>
            <strong>Amount:</strong> ${amount?.toFixed(2)}
          </p>
          <p>
            <strong>Reference:</strong> {reference}
          </p>
          <p>
            <strong>Status:</strong> Completed
          </p>
        </div>
        <p>Thank you for using IAE Bank services.</p>
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}

export function KYCEmail({ name, kycStatus }: EmailTemplateProps) {
  const isApproved = kycStatus === "approved"

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: isApproved ? "#10b981" : "#f59e0b",
          color: "white",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <h1>KYC Status Update</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>Your KYC verification status has been updated.</p>
        <div style={{ backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "5px", margin: "20px 0" }}>
          <p>
            <strong>Status:</strong> {kycStatus?.toUpperCase()}
          </p>
        </div>
        {isApproved ? (
          <p>Congratulations! Your account is now fully verified and you can access all banking services.</p>
        ) : (
          <p>Please review your submitted documents and resubmit if necessary.</p>
        )}
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}

export function AccountEmail({ name, accountNumber, message }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#1e40af", color: "white", padding: "20px", textAlign: "center" }}>
        <h1>Account Update</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>There has been an update to your account.</p>
        {accountNumber && (
          <div style={{ backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "5px", margin: "20px 0" }}>
            <p>
              <strong>Account Number:</strong> {accountNumber}
            </p>
          </div>
        )}
        <p>{message}</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}

export function PasswordResetEmail({ name, resetLink }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#dc2626", color: "white", padding: "20px", textAlign: "center" }}>
        <h1>Password Reset Request</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>You have requested to reset your password for your IAE Bank account.</p>
        <p>Click the link below to reset your password:</p>
        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <a
            href={resetLink}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              padding: "12px 24px",
              textDecoration: "none",
              borderRadius: "5px",
              display: "inline-block",
            }}
          >
            Reset Password
          </a>
        </div>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}

export function GeneralNotificationEmail({ name, title, message }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#6366f1", color: "white", padding: "20px", textAlign: "center" }}>
        <h1>{title || "Notification"}</h1>
      </div>
      <div style={{ padding: "20px" }}>
        <h2>Hello {name}!</h2>
        <p>{message}</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>
          Best regards,
          <br />
          IAE Bank Team
        </p>
      </div>
    </div>
  )
}
