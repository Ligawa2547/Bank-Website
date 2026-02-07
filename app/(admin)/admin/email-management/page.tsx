'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, Mail, CheckCircle, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react'

interface EmailMessage {
  id: string
  subject: string
  sender_email: string
  recipient_email: string
  html: string
  text_content: string
  created_at: string
  status: 'sent' | 'failed' | 'pending'
  error_message?: string
}

interface SendEmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

export default function AdminEmailManagementPage() {
  const [activeTab, setActiveTab] = useState('send')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    html: '',
    from: 'Alghahim Virtual Bank <noreply@bank.alghahim.co.ke>',
  })

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user.email?.endsWith('@alghahim.co.ke')) {
        toast({
          title: 'Unauthorized',
          description: 'You do not have permission to access email management.',
          variant: 'destructive',
        })
        return
      }
    }
    
    checkAdminAccess()
    if (activeTab === 'history') {
      fetchEmails()
    }
  }, [activeTab])

  const fetchEmails = async () => {
    try {
      setIsLoading(true)
      // Fetch email history from a hypothetical email logs table
      // This would be your email tracking table
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching emails:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch email history.',
          variant: 'destructive',
        })
        return
      }

      setEmails(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.to.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email subject.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.html.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter email content.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          html: formData.html,
          from: formData.from,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      toast({
        title: 'Success',
        description: 'Email sent successfully.',
      })

      // Reset form
      setFormData({
        to: '',
        subject: '',
        html: '',
        from: 'Alghahim Virtual Bank <noreply@bank.alghahim.co.ke>',
      })

      // Refresh email history
      fetchEmails()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Management
          </h1>
          <p className="text-muted-foreground">Send and manage emails from Alghahim Virtual Bank</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Email
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email History
          </TabsTrigger>
        </TabsList>

        {/* Send Email Tab */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Email</CardTitle>
              <CardDescription>Compose and send emails from the bank's verified domain</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendEmail} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* From Address */}
                  <div className="space-y-2">
                    <Label htmlFor="from">From Address</Label>
                    <Input
                      id="from"
                      type="email"
                      value={formData.from}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Verified sender address</p>
                  </div>

                  {/* To Address */}
                  <div className="space-y-2">
                    <Label htmlFor="to">Recipient Email *</Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="recipient@example.com"
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  {/* HTML Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="html">Email Content (HTML) *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2"
                      >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                      </Button>
                    </div>
                    <Textarea
                      id="html"
                      placeholder="Enter HTML content for the email..."
                      value={formData.html}
                      onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div
                        className="border rounded-lg p-4 bg-white"
                        dangerouslySetInnerHTML={{ __html: formData.html }}
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Email History</CardTitle>
              <CardDescription>View sent and received emails</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : emails.length === 0 ? (
                <Alert>
                  <AlertDescription>No emails found. Emails will appear here after sending.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(email.status)}
                            <h4 className="font-semibold">{email.subject}</h4>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>To: {email.recipient_email}</p>
                            <p>From: {email.sender_email}</p>
                            <p>Date: {new Date(email.created_at).toLocaleString()}</p>
                          </div>
                          {email.error_message && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertDescription>{email.error_message}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
