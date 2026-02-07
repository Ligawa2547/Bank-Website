// Voice Call Service Utilities for Support Module

import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface VoiceCall {
  id: string
  userId: string
  customerEmail: string
  customerName: string
  assignedStaffId?: string
  status: 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'missed' | 'declined'
  callType: 'voice' | 'video'
  durationSeconds?: number
  startedAt?: Date
  answeredAt?: Date
  endedAt?: Date
  rejectionReason?: string
  recordingUrl?: string
  qualityScore?: number
  createdAt: Date
  updatedAt: Date
}

export async function createVoiceCall(
  userId: string,
  customerEmail: string,
  customerName: string,
  callType: 'voice' | 'video' = 'voice'
): Promise<VoiceCall | null> {
  const { data, error } = await supabase
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

  if (error) {
    console.error('[v0] Error creating voice call:', error)
    return null
  }

  // Add to call queue
  const queueLength = await getQueueLength()
  await supabase.from('call_queue').insert({
    call_id: data.id,
    position: queueLength + 1,
  })

  return data
}

export async function assignCall(callId: string, staffId: string): Promise<VoiceCall | null> {
  const { data, error } = await supabase
    .from('voice_calls')
    .update({
      assigned_staff_id: staffId,
      status: 'ringing',
      started_at: new Date().toISOString(),
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error assigning call:', error)
    return null
  }

  // Remove from queue
  await supabase.from('call_queue').delete().eq('call_id', callId)

  // Log activity
  await supabase.from('support_activity_logs').insert({
    staff_id: staffId,
    activity_type: 'call_started',
    resource_type: 'voice_call',
    resource_id: callId,
  })

  return data
}

export async function answerCall(callId: string): Promise<VoiceCall | null> {
  const { data, error } = await supabase
    .from('voice_calls')
    .update({
      status: 'answered',
      answered_at: new Date().toISOString(),
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error answering call:', error)
    return null
  }

  return data
}

export async function endCall(
  callId: string,
  durationSeconds: number,
  recordingUrl?: string,
  qualityScore?: number
): Promise<VoiceCall | null> {
  const { data, error } = await supabase
    .from('voice_calls')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      recording_url: recordingUrl || null,
      quality_score: qualityScore || null,
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error ending call:', error)
    return null
  }

  return data
}

export async function declineCall(callId: string, reason?: string): Promise<VoiceCall | null> {
  const { data, error } = await supabase
    .from('voice_calls')
    .update({
      status: 'declined',
      rejection_reason: reason || null,
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error declining call:', error)
    return null
  }

  // Return to queue
  const queueLength = await getQueueLength()
  await supabase.from('call_queue').insert({
    call_id: callId,
    position: queueLength + 1,
  })

  return data
}

export async function getQueuedCalls(): Promise<VoiceCall[]> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching queued calls:', error)
    return []
  }

  return data || []
}

export async function getStaffCalls(staffId: string): Promise<VoiceCall[]> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('assigned_staff_id', staffId)
    .in('status', ['ringing', 'answered'])

  if (error) {
    console.error('[v0] Error fetching staff calls:', error)
    return []
  }

  return data || []
}

export async function getCallDuration(callId: string): Promise<number> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('answered_at, ended_at')
    .eq('id', callId)
    .single()

  if (error || !data) {
    return 0
  }

  if (data.answered_at && data.ended_at) {
    const answered = new Date(data.answered_at).getTime()
    const ended = new Date(data.ended_at).getTime()
    return Math.round((ended - answered) / 1000)
  }

  // If still ongoing
  if (data.answered_at) {
    const answered = new Date(data.answered_at).getTime()
    const now = Date.now()
    return Math.round((now - answered) / 1000)
  }

  return 0
}

export async function getQueueLength(): Promise<number> {
  const { count, error } = await supabase
    .from('call_queue')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('[v0] Error getting queue length:', error)
    return 0
  }

  return count || 0
}

export async function storeWebRTCSignaling(
  callId: string,
  initiatorId: string,
  peerId: string,
  sdpOffer?: string,
  sdpAnswer?: string,
  iceCandidates?: any[]
): Promise<boolean> {
  const { error } = await supabase.from('webrtc_signaling').insert({
    call_id: callId,
    initiator_id: initiatorId,
    peer_id: peerId,
    sdp_offer: sdpOffer || null,
    sdp_answer: sdpAnswer || null,
    ice_candidates: iceCandidates || [],
  })

  if (error) {
    console.error('[v0] Error storing WebRTC signaling:', error)
    return false
  }

  return true
}
