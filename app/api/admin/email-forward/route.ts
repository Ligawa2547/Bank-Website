import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderEmail,
      subject,
      htmlContent,
      messageId,
      recipientEmail,
    } = body;

    // Validate that email is from bank.alghahim.co.ke domain
    if (!recipientEmail?.endsWith("@bank.alghahim.co.ke")) {
      return NextResponse.json(
        { error: "Only emails to @bank.alghahim.co.ke can be forwarded" },
        { status: 400 }
      );
    }

    // Get super admin email from environment or database
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@bank.alghahim.co.ke";

    // Forward email to super admin
    const forwardResult = await resend.emails.send({
      from: `forwarded@bank.alghahim.co.ke`,
      to: superAdminEmail,
      subject: `[FORWARDED] ${subject}`,
      html: `
        <h2>Forwarded Email</h2>
        <p><strong>From:</strong> ${senderEmail}</p>
        <p><strong>Original Recipient:</strong> ${recipientEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <div>${htmlContent}</div>
      `,
    });

    // Log the email forward in audit trail
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Insert into email_audit table
    await supabase.from("email_audit").insert({
      recipient_email: recipientEmail,
      sender_email: senderEmail,
      subject,
      message_id: messageId,
      forwarded_to_super_admin: true,
      forwarded_at: new Date().toISOString(),
      status: "forwarded",
    });

    return NextResponse.json({
      success: true,
      messageId: forwardResult.id,
    });
  } catch (error) {
    console.error("[v0] Email forward error:", error);
    return NextResponse.json(
      { error: "Failed to forward email" },
      { status: 500 }
    );
  }
}
