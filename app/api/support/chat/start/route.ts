import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { userId, customerEmail, customerName } = await req.json()

    if (!userId || !customerEmail || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create chat session
    const { data: chatSession, error: chatError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        customer_email: customerEmail,
        customer_name: customerName,
        status: 'pending',
      })
      .select()
      .single()

    if (chatError) {
      console.error('[v0] Error creating chat session:', chatError)
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
    }

    // Add to queue
    const { data: queueData, error: queueError } = await supabase
      .from('chat_queue')
      .select('position', { count: 'exact' })

    if (!queueError && queueData) {
      await supabase.from('chat_queue').insert({
        session_id: chatSession.id,
        position: (queueData.length || 0) + 1,
      })
    }

    // Log activity
    await supabase.from('support_activity_logs').insert({
      user_id: userId,
      activity_type: 'chat_started',
      resource_type: 'chat_session',
      resource_id: chatSession.id,
      details: { customer_email: customerEmail, customer_name: customerName },
    })

    return NextResponse.json(chatSession, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in chat start API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
