import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend/client'
import { getAgreementEmailTemplate } from '@/lib/email/agreement-template'
import { generateAgreementHTML, type AgreementData } from '@/lib/pdf/agreement-generator'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName, lastName, accountNumber } = await request.json()

    if (!userId || !email || !firstName || !lastName || !accountNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prepare agreement data
    const agreementData: AgreementData = {
      firstName,
      lastName,
      email,
      accountNumber,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }

    // Generate agreement HTML
    const agreementHTML = generateAgreementHTML(agreementData)

    // Get email template
    const emailTemplate = getAgreementEmailTemplate({
      firstName,
      lastName,
      accountNumber,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    })

    // Send email with agreement
    // Note: Resend.com supports HTML attachments. For PDF, you may need to use a service like html2pdf
    // For now, we'll send the HTML content inline and provide a link to download/view
    const emailResult = await sendEmail({
      to: email,
      subject: `Your AV Bank Account Agreement - Account #${accountNumber}`,
      html: emailTemplate,
    })

    if (!emailResult) {
      throw new Error('Failed to send email')
    }

    // Log agreement sent in database
    const { error: dbError } = await supabase.from('email_logs').insert({
      recipient_email: email,
      sender_email: 'noreply@bank.aghq.co.ke',
      subject: `Your AV Bank Account Agreement - Account #${accountNumber}`,
      html: emailTemplate,
      status: 'sent',
      resend_id: emailResult.id,
      sent_by: userId,
    })

    if (dbError) {
      console.error('Database logging error:', dbError)
      // Don't fail the request if logging fails
    }

    // Store agreement sent timestamp in user profile if needed
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request if profile update fails
    }

    return NextResponse.json(
      {
        success: true,
        messageId: emailResult.id,
        message: 'Agreement sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Agreement send error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send agreement' },
      { status: 500 }
    )
  }
}
