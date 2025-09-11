import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
) {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error sending notification:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: false, error }
  }
}

export async function sendTransactionNotification(
  userId: string,
  transactionType: string,
  amount: number,
  reference: string,
) {
  const title = `Transaction ${transactionType}`
  const message = `Your ${transactionType.toLowerCase()} of $${amount.toFixed(2)} has been processed. Reference: ${reference}`

  return await sendNotification(userId, title, message, "success")
}

export async function sendAdminNotification(
  adminId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
) {
  try {
    const { error } = await supabase.from("admin_notifications").insert({
      admin_id: adminId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error sending admin notification:", error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending admin notification:", error)
    return { success: false, error }
  }
}
