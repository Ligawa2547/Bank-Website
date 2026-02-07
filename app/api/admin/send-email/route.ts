'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend/client'

interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Get current session
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(
      request.headers.get('x-user-id') || ''
    )

    if (!user?.email?.endsWith('@alghahim.co.ke')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: EmailPayload = await request.json()

    // Validate input
    if (!body.to || !body.subject || !body.html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Send email via Resend
    const result = await sendEmail({
      to: body.to,
      subject: body.subject,
      html: body.html,
      from: body.from || 'Alghahim Virtual Bank <noreply@bank.alghahim.co.ke>',
    })

    // Log email in database (optional)
    try {
      await supabase.from('email_logs').insert({
        to: body.to,
        from: body.from || 'Alghahim Virtual Bank <noreply@bank.alghahim.co.ke>',
        subject: body.subject,
        html: body.html,
        text: body.html.replace(/<[^>]*>/g, ''),
        status: 'sent',
        created_at: new Date().toISOString(),
        sent_by: user.id,
      })
    } catch (logError) {
      console.error('Failed to log email:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    })
  } catch (error) {
    console.error('Email send error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send email'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
