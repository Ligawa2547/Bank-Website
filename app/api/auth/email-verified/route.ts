import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/resend/client'
import { getAgreementEmailTemplate } from '@/lib/email/agreement-template'
import { generateAgreementHTML, type AgreementData } from '@/lib/pdf/agreement-generator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

/**
 * This webhook is triggered when a user verifies their email
 * It sends the account agreement document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, account_no, created_at')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare agreement data
    const agreementData: AgreementData = {
      firstName: userData.first_name || 'Valued',
      lastName: userData.last_name || 'Customer',
      email: userData.email || email,
      accountNumber: userData.account_no || 'N/A',
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
      firstName: userData.first_name || 'Valued',
      lastName: userData.last_name || 'Customer',
      accountNumber: userData.account_no || 'N/A',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
    })

    // Send agreement email
    const emailResult = await sendEmail({
      to: email,
      subject: `Your AV Bank Account Agreement - Account #${userData.account_no || 'New'}`,
      html: emailTemplate,
    })

    if (!emailResult) {
      throw new Error('Failed to send agreement email')
    }

    // Log email
    await supabase.from('email_logs').insert({
      recipient_email: email,
      sender_email: 'noreply@bank.aghq.co.ke',
      subject: `Your AV Bank Account Agreement - Account #${userData.account_no || 'New'}`,
      html: emailTemplate,
      status: 'sent',
      resend_id: emailResult.id,
      sent_by: userId,
    }).catch((err) => console.error('[v0] Email log error:', err))

    return NextResponse.json(
      {
        success: true,
        message: 'Agreement sent successfully',
        messageId: emailResult.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Email verification callback error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send agreement' },
      { status: 500 }
    )
  }
}
