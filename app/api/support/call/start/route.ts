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

    const { userId, customerEmail, customerName, callType = 'voice' } = await req.json()

    if (!userId || !customerEmail || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create voice call
    const { data: voiceCall, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        user_id: userId,
        customer_email: customerEmail,
        customer_name: customerName,
        call_type: callType,
        status: 'queued',
      })
      .select()
      .single()

    if (callError) {
      console.error('[v0] Error creating voice call:', callError)
      return NextResponse.json({ error: 'Failed to create voice call' }, { status: 500 })
    }

    // Add to queue
    const { data: queueData, error: queueError } = await supabase
      .from('call_queue')
      .select('position', { count: 'exact' })

    if (!queueError && queueData) {
      await supabase.from('call_queue').insert({
        call_id: voiceCall.id,
        position: (queueData.length || 0) + 1,
      })
    }

    // Log activity
    await supabase.from('support_activity_logs').insert({
      user_id: userId,
      activity_type: 'call_started',
      resource_type: 'voice_call',
      resource_id: voiceCall.id,
      details: { customer_email: customerEmail, customer_name: customerName, call_type: callType },
    })

    return NextResponse.json(voiceCall, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in call start API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
