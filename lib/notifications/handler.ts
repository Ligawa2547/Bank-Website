import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Send notification to database and email
export const sendNotificationWithEmail = async (
  accountNumber: string,
  title: string,
  message: string,
  type = "info",
  additionalData?: any,
) => {
  try {
    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNumber,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting notification:", notificationError)
    }

    // Send email notification
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "general",
        accountNumber,
        notificationData: {
          title,
          message,
          type,
        },
        ...additionalData,
      }),
    })

    if (!response.ok) {
      console.error("Failed to send email notification")
    }

    console.log("Notification sent successfully")
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}

// Send transaction notification
export const sendTransactionNotification = async (
  accountNumber: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) => {
  try {
    const title = `Transaction ${status.charAt(0).toUpperCase() + status.slice(1)}`
    const message = `Your ${transactionType.replace(/_/g, " ")} of $${amount.toFixed(2)} has been ${status}. Reference: ${reference}`

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNumber,
      title,
      message,
      type: status === "completed" ? "success" : status === "failed" ? "error" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting transaction notification:", notificationError)
    }

    // Send email notification
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "transaction",
        accountNumber,
        transactionData: {
          transactionType,
          amount,
          status,
          reference,
          description,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to send transaction email notification")
    }

    console.log("Transaction notification sent successfully")
  } catch (error) {
    console.error("Error sending transaction notification:", error)
  }
}

// Send KYC status notification
export const sendKYCStatusNotification = async (userId: string, status: string, rejectionReason?: string) => {
  try {
    const title = `KYC ${status === "approved" ? "Approved" : "Status Updated"}`
    const message =
      status === "approved"
        ? "Congratulations! Your KYC verification has been approved. You now have full access to all banking features."
        : status === "rejected"
          ? `Your KYC verification has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : "Please contact support for more information."}`
          : `Your KYC verification status has been updated to ${status}.`

    // Get user details to get account number
    const { data: user, error: userError } = await supabase.from("users").select("account_no").eq("id", userId).single()

    if (userError || !user) {
      console.error("Error fetching user for KYC notification:", userError)
      return
    }

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: user.account_no,
      title,
      message,
      type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting KYC notification:", notificationError)
    }

    // Send email notification
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "kyc",
        userId,
        kycData: {
          status,
          rejectionReason,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to send KYC email notification")
    }

    console.log("KYC notification sent successfully")
  } catch (error) {
    console.error("Error sending KYC notification:", error)
  }
}

// Send account status notification
export const sendAccountStatusNotification = async (userId: string, status: string, reason?: string) => {
  try {
    const title = `Account ${status === "active" ? "Activated" : "Status Updated"}`
    const message =
      status === "suspended"
        ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : "Please contact support for assistance."}`
        : status === "active"
          ? "Your account has been reactivated. You now have full access to all features."
          : `Your account status has been updated to ${status}.`

    // Get user details to get account number
    const { data: user, error: userError } = await supabase.from("users").select("account_no").eq("id", userId).single()

    if (userError || !user) {
      console.error("Error fetching user for account status notification:", userError)
      return
    }

    // Insert notification into database
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: user.account_no,
      title,
      message,
      type: status === "suspended" ? "warning" : "info",
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error inserting account status notification:", notificationError)
    }

    // Send email notification
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "account_status",
        userId,
        accountStatusData: {
          status,
          reason,
        },
      }),
    })

    if (!response.ok) {
      console.error("Failed to send account status email notification")
    }

    console.log("Account status notification sent successfully")
  } catch (error) {
    console.error("Error sending account status notification:", error)
  }
}
