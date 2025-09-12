import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, type = "info", sendEmail = false } = await request.json()

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields: userId, title, message" }, { status: 400 })
    }

    // Create notification in database
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
    }

    // Send email if requested
    if (sendEmail) {
      try {
        // Get user details
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email, full_name, first_name, last_name")
          .eq("id", userId)
          .single()

        if (userError || !user?.email) {
          console.error("Error fetching user for email:", userError)
        } else {
          const userName = user.full_name || `${user.first_name} ${user.last_name}` || "Valued Customer"

          await resend.emails.send({
            from: "IAE Bank <noreply@iaebank.com>",
            to: user.email,
            subject: title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">IAE Bank</h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                  <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
                  
                  <p style="color: #666; margin-bottom: 20px;">Dear ${userName},</p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${
                    type === "success"
                      ? "#28a745"
                      : type === "error"
                        ? "#dc3545"
                        : type === "warning"
                          ? "#ffc107"
                          : "#007bff"
                  };">
                    <p style="color: #333; margin: 0; line-height: 1.6;">${message}</p>
                  </div>
                  
                  <p style="color: #666; margin-top: 30px;">
                    If you have any questions, please don't hesitate to contact our support team.
                  </p>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                       style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      View Dashboard
                    </a>
                  </div>
                </div>
                
                <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
                  <p style="margin: 0;">© 2024 IAE Bank. All rights reserved.</p>
                  <p style="margin: 5px 0 0 0;">This is an automated message, please do not reply.</p>
                </div>
              </div>
            `,
          })

          console.log("✅ Email sent successfully to:", user.email)
        }
      } catch (emailError) {
        console.error("❌ Email sending error (non-blocking):", emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Notification created successfully",
    })
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
