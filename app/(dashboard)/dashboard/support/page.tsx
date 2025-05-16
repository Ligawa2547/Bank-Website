"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SupportTicket, SupportMessage } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Send, MessageSquare, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function SupportPage() {
  const { user, profile } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newTicketSubject, setNewTicketSubject] = useState("")
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user) return

    const fetchTickets = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setTickets(data)
        if (data.length > 0 && !selectedTicket) {
          setSelectedTicket(data[0])
        }
      }
      setIsLoading(false)
    }

    fetchTickets()
  }, [user, supabase, selectedTicket])

  useEffect(() => {
    if (!selectedTicket) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", selectedTicket.id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          // @ts-ignore
          setMessages((prev) => [...prev, payload.new])
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [selectedTicket, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !selectedTicket || !newMessage.trim()) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_type: "user",
        message: newMessage,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Update ticket status if it was closed
      if (selectedTicket.status === "closed") {
        await supabase
          .from("support_tickets")
          .update({ status: "open", updated_at: new Date().toISOString() })
          .eq("id", selectedTicket.id)

        // Refresh tickets
        const { data } = await supabase.from("support_tickets").select("*").eq("id", selectedTicket.id).single()

        if (data) {
          setSelectedTicket(data)
          setTickets(tickets.map((t) => (t.id === data.id ? data : t)))
        }
      }

      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !newTicketSubject.trim() || !newTicketMessage.trim()) return

    setIsSubmitting(true)

    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: newTicketSubject,
          message: newTicketMessage,
          status: "open",
        })
        .select()

      if (ticketError) {
        throw new Error(ticketError.message)
      }

      // Create initial message
      if (ticketData && ticketData[0]) {
        await supabase.from("support_messages").insert({
          ticket_id: ticketData[0].id,
          sender_type: "user",
          message: newTicketMessage,
        })

        // Refresh tickets
        const { data } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (data) {
          setTickets(data)
          setSelectedTicket(ticketData[0])
        }

        toast({
          title: "Success",
          description: "Support ticket created successfully",
        })

        // Reset form
        setNewTicketSubject("")
        setNewTicketMessage("")
        setShowNewTicketForm(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "in_progress":
        return <MessageSquare className="h-4 w-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open"
      case "in_progress":
        return "In Progress"
      case "resolved":
        return "Resolved"
      case "closed":
        return "Closed"
      default:
        return status
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support</h1>
        <Button onClick={() => setShowNewTicketForm(!showNewTicketForm)} className="bg-[#0A3D62] hover:bg-[#0F5585]">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {showNewTicketForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Support Ticket</CardTitle>
            <CardDescription>Describe your issue and we'll get back to you as soon as possible</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Please provide details about your issue"
                  rows={5}
                  required
                  className="w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTicketForm(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0A3D62] hover:bg-[#0F5585] w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-md cursor-pointer ${
                        selectedTicket?.id === ticket.id ? "bg-[#0A3D62] text-white" : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                        <div className={`flex items-center ${selectedTicket?.id === ticket.id ? "text-white" : ""}`}>
                          {getStatusIcon(ticket.status)}
                        </div>
                      </div>
                      <p className={`text-xs ${selectedTicket?.id === ticket.id ? "text-blue-100" : "text-gray-500"}`}>
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No support tickets yet</p>
                  <Button onClick={() => setShowNewTicketForm(true)} variant="link" className="mt-2 text-[#0A3D62]">
                    Create your first ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      Created {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1">{getStatusText(selectedTicket.status)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender_type === "user" ? "bg-[#0A3D62] text-white" : "bg-gray-100"
                        }`}
                      >
                        <p>{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_type === "user" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t p-4">
                <form onSubmit={handleSendMessage} className="w-full">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      disabled={selectedTicket.status === "closed"}
                    />
                    <Button
                      type="submit"
                      className="bg-[#0A3D62] hover:bg-[#0F5585]"
                      disabled={isSubmitting || selectedTicket.status === "closed"}
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                  {selectedTicket.status === "closed" && (
                    <p className="text-xs text-gray-500 mt-2">This ticket is closed. Send a message to reopen it.</p>
                  )}
                </form>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select a ticket to view the conversation</p>
                {tickets.length === 0 && (
                  <Button onClick={() => setShowNewTicketForm(true)} variant="link" className="mt-2 text-[#0A3D62]">
                    Create your first ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
