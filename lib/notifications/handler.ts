import { createClient } from "@/lib/supabase/client"
import { sendNotificationEmail } from "@/lib/email/notifications"

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  sendEmail?: boolean
  metadata?: any
}

export async function createNotification(data: NotificationData) {
  const supabase = createClient()

  try {
    // First, create the notification in the database
    const { data: notification, error: dbError } = await supabase
      .from("notifications")
      .insert({
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata || {},
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error creating notification:", dbError)
      throw new Error(`Failed to create notification: ${dbError.message}`)
    }

    console.log("✅ Notification created in database:", notification?.id)

    // If email should be sent, send it (but don't fail the whole operation if email fails)
    if (data.sendEmail) {
      try {
        // Get user details for email
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email, full_name")
          .eq("id", data.userId)
          .single()

        if (userError) {
          console.error("Error fetching user for email:", userError)
        } else if (user?.email) {
          console.log("📧 Sending notification email to:", user.email)

          const emailResult = await sendNotificationEmail({
            to: user.email,
            type: "general",
            data: {
              user_name: user.full_name || "Valued Customer",
              title: data.title,
              message: data.message,
            },
          })

          console.log("✅ Notification email sent successfully")
        } else {
          console.warn("⚠️ User email not found, skipping email notification")
        }
      } catch (emailError) {
        console.error("❌ Email sending error (non-blocking):", emailError)
        // Don't throw here - email failure shouldn't break notification creation
      }
    }

    return {
      success: true,
      data: notification,
      message: "Notification created successfully",
    }
  } catch (error) {
    console.error("❌ Error in createNotification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Failed to create notification",
    }
  }
}

export async function sendTransactionNotification(
  accountNo: string,
  transactionType: "deposit" | "withdrawal" | "transfer",
  amount: number,
  status: "completed" | "pending" | "failed",
  reference: string,
  narration: string,
) {
  const supabase = createClient()

  try {
    // Get user by account number
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, first_name, last_name, balance")
      .eq("account_no", accountNo)
      .single()

    if (userError || !user) {
      console.error("User not found for account:", accountNo)
      return { success: false, error: "User not found" }
    }

    // Create notification
    const notificationTitle = `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} ${status.charAt(0).toUpperCase() + status.slice(1)}`
    const notificationMessage = `Your ${transactionType} of $${amount.toFixed(2)} has been ${status}. Reference: ${reference}`

    const notificationResult = await createNotification({
      userId: user.id,
      title: notificationTitle,
      message: notificationMessage,
      type: status === "completed" ? "success" : status === "failed" ? "error" : "info",
      sendEmail: true,
      metadata: {
        transaction_type: transactionType,
        amount,
        status,
        reference,
        narration,
      },
    })

    // Send transaction email
    try {
      await sendNotificationEmail({
        to: user.email,
        type: "transaction",
        data: {
          user_name: user.full_name || `${user.first_name} ${user.last_name}` || "Valued Customer",
          transaction_type: transactionType,
          amount,
          balance: user.balance || 0,
          payment_method: "PayPal",
          transaction_id: reference,
          date: new Date().toISOString(),
        },
      })
    } catch (emailError) {
      console.error("Transaction email error:", emailError)
    }

    return notificationResult
  } catch (error) {
    console.error("Error sending transaction notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getUserNotifications(userId: string, limit = 50) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    }
  }
}

export async function deleteNotification(notificationId: string, userId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
