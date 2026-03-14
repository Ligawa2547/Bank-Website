import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/resend/client"
import {
  getTransactionEmailTemplate,
  getKYCStatusEmailTemplate,
  getAccountStatusEmailTemplate,
  getGeneralNotificationEmailTemplate,
} from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, accountNo, userId, ...data } = body

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Get user details - try by account number first, then by user ID
    let user = null
    if (accountNo) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, account_no")
        .eq("account_no", accountNo)
        .single()

      if (!userError && userData) {
        user = userData
      }
    } else if (userId) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, account_no")
        .eq("id", userId)
        .single()

      if (!userError && userData) {
        user = userData
      }
    }

    if (!user) {
      console.error("User not found for notification")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let notificationTitle = ""
    let notificationMessage = ""
    let emailTemplate = ""
    let notificationType = "info"

    // Handle different notification types
    switch (type) {
      case "transaction":
        const { transactionType, amount, status, reference, description } = data
        notificationTitle = `Transaction ${status === "completed" ? "Completed" : status === "pending" ? "Pending" : "Failed"}`
        notificationMessage = `Your ${transactionType.toLowerCase().replace("_", " ")} of $${amount.toFixed(2)} has been ${status}. Reference: ${reference}`
        notificationType = status === "completed" ? "success" : status === "failed" ? "error" : "info"
        emailTemplate = getTransactionEmailTemplate(transactionType, amount, status, reference, description)
        break

      case "kyc":
        const { status: kycStatus, reason: kycReason } = data
        notificationTitle = `KYC ${kycStatus === "approved" ? "Approved" : "Update"}`
        notificationMessage =
          kycStatus === "approved"
            ? "Congratulations! Your KYC verification has been approved. You now have full access to all banking features."
            : `Your KYC status has been updated to ${kycStatus}.${kycReason ? ` Reason: ${kycReason}` : ""}`
        notificationType = kycStatus === "approved" ? "success" : "warning"
        emailTemplate = getKYCStatusEmailTemplate("User", kycStatus, kycReason)
        break

      case "account_status":
        const { status: accountStatus, reason: accountReason } = data
        notificationTitle = `Account ${accountStatus === "active" ? "Activated" : "Status Update"}`
        notificationMessage =
          accountStatus === "active"
            ? "Your account has been activated. Welcome to IAE Bank!"
            : `Your account status has been updated to ${accountStatus}.${accountReason ? ` Reason: ${accountReason}` : ""}`
        notificationType = accountStatus === "active" ? "success" : "warning"
        emailTemplate = getAccountStatusEmailTemplate("User", accountStatus, accountReason)
        break

      case "general":
        const { title, message } = data
        notificationTitle = title
        notificationMessage = message
        notificationType = "info"
        emailTemplate = getGeneralNotificationEmailTemplate("User", title, message)
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Create database notification
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: user.account_no,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    // Send email notification
    let emailSent = false
    try {
      await sendEmail({
        to: user.email,
        subject: `IAE Bank - ${notificationTitle}`,
        html: emailTemplate,
      })
      emailSent = true
      console.log(`Email sent successfully to ${user.email}`)
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Notification processed successfully",
      notificationCreated: !notificationError,
      emailSent,
    })
  } catch (error) {
    console.error("Error in notification handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
