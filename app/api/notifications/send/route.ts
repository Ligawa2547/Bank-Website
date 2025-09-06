import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/resend/client"
import {
  getTransactionEmailTemplate,
  getKYCEmailTemplate,
  getAccountStatusEmailTemplate,
  getGeneralNotificationEmailTemplate,
} from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, accountNo, ...data } = body

    const supabase = createRouteHandlerClient({ cookies })

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("account_no", accountNo)
      .single()

    if (userError || !user) {
      console.error("User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let notificationTitle = ""
    let notificationMessage = ""
    let emailTemplate = ""

    // Handle different notification types
    switch (type) {
      case "transaction":
        const { transactionType, amount, status, reference, description } = data
        notificationTitle = `Transaction ${status === "completed" ? "Completed" : status === "pending" ? "Pending" : "Failed"}`
        notificationMessage = `Your ${transactionType.toLowerCase()} of $${amount.toFixed(2)} has been ${status}.`
        emailTemplate = getTransactionEmailTemplate(transactionType, amount, status, reference, description)
        break

      case "kyc":
        const { status: kycStatus, reason: kycReason } = data
        notificationTitle = `KYC ${kycStatus === "approved" ? "Approved" : "Update"}`
        notificationMessage =
          kycStatus === "approved"
            ? "Your KYC verification has been approved. You now have full access to all features."
            : `Your KYC status has been updated to ${kycStatus}.${kycReason ? ` Reason: ${kycReason}` : ""}`
        emailTemplate = getKYCEmailTemplate(kycStatus, kycReason)
        break

      case "account_status":
        const { status: accountStatus, reason: accountReason } = data
        notificationTitle = `Account ${accountStatus === "active" ? "Activated" : "Status Update"}`
        notificationMessage =
          accountStatus === "active"
            ? "Your account has been activated. Welcome to IAE Bank!"
            : `Your account status has been updated to ${accountStatus}.${accountReason ? ` Reason: ${accountReason}` : ""}`
        emailTemplate = getAccountStatusEmailTemplate(accountStatus, accountReason)
        break

      case "general":
        const { title, message } = data
        notificationTitle = title
        notificationMessage = message
        emailTemplate = getGeneralNotificationEmailTemplate(title, message)
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Create database notification
    const { error: notificationError } = await supabase.from("notifications").insert({
      account_no: accountNo,
      title: notificationTitle,
      message: notificationMessage,
      is_read: false,
      created_at: new Date().toISOString(),
    })

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: `IAE Bank - ${notificationTitle}`,
        html: emailTemplate,
      })
      console.log(`Email sent successfully to ${user.email}`)
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      notificationCreated: !notificationError,
    })
  } catch (error) {
    console.error("Error in notification handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
