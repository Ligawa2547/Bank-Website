interface EmailTemplateProps {
  userName: string
  [key: string]: any
}

export function WelcomeEmail({ userName, accountNumber }: { userName: string; accountNumber: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <h1 style={{ color: "#1e40af", fontSize: "32px", marginBottom: "16px" }}>Welcome to IAE Bank!</h1>
        <p style={{ fontSize: "18px", color: "#4b5563", marginBottom: "30px" }}>
          Thank you for choosing IAE Bank as your trusted financial partner.
        </p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", margin: "30px 0" }}>
        <h2 style={{ color: "#1e293b", fontSize: "20px", marginBottom: "16px" }}>Your Account Details</h2>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Account Number:</strong> {accountNumber}
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Account Type:</strong> Personal Banking
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Status:</strong> Active
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Access Your Dashboard
        </a>
      </div>
    </div>
  )
}

export function TransactionEmail({
  userName,
  transactionType,
  amount,
  balance,
  paymentMethod,
  transactionId,
  date,
}: {
  userName: string
  transactionType: string
  amount: number
  balance: number
  paymentMethod: string
  transactionId: string
  date: string
}) {
  const isDeposit = transactionType === "deposit"

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>{isDeposit ? "💰" : "💸"}</div>
        <h1 style={{ color: "#1e40af", fontSize: "28px", marginBottom: "16px" }}>
          Transaction {isDeposit ? "Deposit" : "Withdrawal"} Successful
        </h1>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "30px" }}>
          Your {transactionType} has been processed successfully.
        </p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", margin: "30px 0" }}>
        <h2 style={{ color: "#1e293b", fontSize: "20px", marginBottom: "16px" }}>Transaction Details</h2>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Amount:</strong> ${amount.toFixed(2)}
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Payment Method:</strong> {paymentMethod}
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Transaction ID:</strong> {transactionId}
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>New Balance:</strong> ${balance.toFixed(2)}
        </p>
        <p style={{ margin: "8px 0", color: "#1e293b" }}>
          <strong>Date:</strong> {new Date(date).toLocaleDateString()}
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions`}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          View Transaction History
        </a>
      </div>
    </div>
  )
}

export function KYCEmail({ userName, status, message }: { userName: string; status: string; message: string }) {
  const statusConfig = {
    approved: { icon: "✅", color: "#22c55e", bgColor: "#dcfce7" },
    rejected: { icon: "❌", color: "#ef4444", bgColor: "#fee2e2" },
    pending: { icon: "⏳", color: "#f59e0b", bgColor: "#fef3c7" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>{config.icon}</div>
        <h1 style={{ color: config.color, fontSize: "28px", marginBottom: "16px" }}>KYC Status Update</h1>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "30px" }}>{message}</p>
      </div>

      <div
        style={{
          background: config.bgColor,
          border: `1px solid ${config.color}`,
          borderRadius: "8px",
          padding: "24px",
          margin: "30px 0",
        }}
      >
        <h3 style={{ color: config.color, marginBottom: "16px" }}>Status: {status.toUpperCase()}</h3>
        <p style={{ color: "#374151", margin: "0" }}>
          Hello {userName}, your KYC verification status has been updated to {status}.
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/kyc`}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          View KYC Status
        </a>
      </div>
    </div>
  )
}

export function AccountEmail({ userName, title, message }: { userName: string; title: string; message: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏦</div>
        <h1 style={{ color: "#1e40af", fontSize: "28px", marginBottom: "16px" }}>{title}</h1>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "30px" }}>Hello {userName},</p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", margin: "30px 0" }}>
        <p style={{ color: "#374151", margin: "0", lineHeight: "1.6" }}>{message}</p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Access Your Account
        </a>
      </div>
    </div>
  )
}

export function PasswordResetEmail({ userName, resetLink }: { userName: string; resetLink: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔐</div>
        <h1 style={{ color: "#1e40af", fontSize: "28px", marginBottom: "16px" }}>Password Reset Request</h1>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "30px" }}>
          Hello {userName}, we received a request to reset your password.
        </p>
      </div>

      <div
        style={{
          background: "#fef3c7",
          border: "1px solid #f59e0b",
          borderRadius: "8px",
          padding: "20px",
          margin: "30px 0",
        }}
      >
        <p style={{ color: "#92400e", margin: "0", fontSize: "14px" }}>
          If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <p style={{ color: "#374151", marginBottom: "24px" }}>
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        <a
          href={resetLink}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Reset My Password
        </a>
      </div>
    </div>
  )
}

export function GeneralNotificationEmail({
  userName,
  title,
  message,
}: {
  userName: string
  title: string
  message: string
}) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📧</div>
        <h1 style={{ color: "#1e40af", fontSize: "28px", marginBottom: "16px" }}>{title}</h1>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "30px" }}>Hello {userName},</p>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "24px", margin: "30px 0" }}>
        <p style={{ color: "#374151", margin: "0", lineHeight: "1.6" }}>{message}</p>
      </div>

      <div style={{ textAlign: "center", margin: "40px 0" }}>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
          style={{
            display: "inline-block",
            background: "#1e40af",
            color: "white",
            padding: "16px 32px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Access Your Dashboard
        </a>
      </div>
    </div>
  )
}
