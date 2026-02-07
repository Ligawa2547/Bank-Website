'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Phone, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { createChatSession, sendMessage, getChatMessages, assignChat } from '@/lib/support/chat-service'
import { createVoiceCall } from '@/lib/support/call-service'
import type { ChatMessage } from '@/lib/support/chat-service'

interface FloatingChatWidgetProps {
  userId?: string
  customerEmail?: string
  customerName?: string
  onCallStart?: (callId: string) => void
}

export function FloatingChatWidget({
  userId,
  customerEmail = '',
  customerName = '',
  onCallStart,
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleStartChat = async () => {
    if (!userId) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to start a chat',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const session = await createChatSession(userId, customerEmail || 'guest@bank.alghahim.co.ke', customerName || 'Guest')
      if (session) {
        setSessionId(session.id)
        setMessages([])
        // Try to auto-assign to available staff
        // In a real app, this would be handled by a separate service
      } else {
        toast({
          title: 'Error',
          description: 'Failed to start chat session',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || !userId) return

    const messageText = inputValue
    setInputValue('')

    try {
      const message = await sendMessage(sessionId, userId, 'customer', customerName || 'You', messageText)
      if (message) {
        setMessages((prev) => [...prev, message])
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    }
  }

  const handleStartCall = async () => {
    if (!userId) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to start a call',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const call = await createVoiceCall(userId, customerEmail || 'guest@bank.alghahim.co.ke', customerName || 'Guest', 'voice')
      if (call) {
        setIsCallActive(true)
        onCallStart?.(call.id)
        toast({
          title: 'Call initiated',
          description: 'Connecting to the next available agent...',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to initiate call',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-primary text-white p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] rounded-lg shadow-2xl flex flex-col z-50 bg-white">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between rounded-t-lg">
        <div>
          <h3 className="font-semibold">Customer Support</h3>
          <p className="text-sm opacity-90">We are here to help</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary/80 p-1 rounded"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {!sessionId ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium mb-4">Start a conversation</p>
            <Button onClick={handleStartChat} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Start Chat
            </Button>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.senderType === 'customer'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {msg.senderType !== 'customer' && (
                    <p className="text-xs font-semibold opacity-70 mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {sessionId && (
        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleStartCall}
            disabled={isLoading || isCallActive}
            className="w-full text-sm bg-transparent"
          >
            <Phone className="h-4 w-4 mr-2" />
            {isCallActive ? 'Call in progress...' : 'Start voice call'}
          </Button>
        </div>
      )}
    </Card>
  )
}
