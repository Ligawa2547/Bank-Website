// Chat Service Utilities for Support Module

import { createBrowserClient } from '@supabase/ssr'
import { maskSensitiveData } from '@/lib/support-config'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderType: 'customer' | 'staff' | 'system'
  senderName: string
  message: string
  messageType: 'text' | 'file' | 'image' | 'system'
  fileUrl?: string
  isRead: boolean
  createdAt: Date
}

export interface ChatSession {
  id: string
  userId: string
  customerEmail: string
  customerName: string
  assignedStaffId?: string
  status: 'pending' | 'active' | 'closed' | 'transferred'
  rating?: number
  ratingComment?: string
  startedAt: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export async function createChatSession(
  userId: string,
  customerEmail: string,
  customerName: string
): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      customer_email: customerEmail,
      customer_name: customerName,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating chat session:', error)
    return null
  }

  return data
}

export async function sendMessage(
  sessionId: string,
  senderId: string,
  senderType: 'customer' | 'staff',
  senderName: string,
  message: string,
  messageType: 'text' | 'file' | 'image' = 'text',
  fileUrl?: string
): Promise<ChatMessage | null> {
  // Mask sensitive data before storing
  const maskedMessage = maskSensitiveData(message)

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender_id: senderId,
      sender_type: senderType,
      sender_name: senderName,
      message: maskedMessage,
      message_type: messageType,
      file_url: fileUrl,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error sending message:', error)
    return null
  }

  return data
}

export async function getChatMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching messages:', error)
    return []
  }

  return (data || []).reverse()
}

export async function assignChat(sessionId: string, staffId: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({
      assigned_staff_id: staffId,
      status: 'active',
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error assigning chat:', error)
    return null
  }

  // Log activity
  await supabase.from('support_activity_logs').insert({
    staff_id: staffId,
    activity_type: 'chat_started',
    resource_type: 'chat_session',
    resource_id: sessionId,
  })

  return data
}

export async function closeChat(sessionId: string, rating?: number, comment?: string): Promise<ChatSession | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      rating: rating || null,
      rating_comment: comment || null,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error closing chat:', error)
    return null
  }

  return data
}

export async function markMessagesAsRead(sessionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .neq('sender_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('[v0] Error marking messages as read:', error)
    return false
  }

  return true
}

export async function getUnassignedChats(): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('status', 'pending')
    .is('assigned_staff_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching unassigned chats:', error)
    return []
  }

  return data || []
}

export async function getStaffChats(staffId: string): Promise<ChatSession[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('assigned_staff_id', staffId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching staff chats:', error)
    return []
  }

  return data || []
}
