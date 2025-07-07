"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Send, Users, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  account_no: string
  status: string
  kyc_status: string
}

interface NotificationTemplate {
  id: string
  title: string
  message: string
  type: string
}

export default function NotificationManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState("info")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const supabase = createClient()
  const { toast } = useToast()

  const templates: NotificationTemplate[] = [
    {
      id: "maintenance",
      title: "Scheduled System Maintenance",
      message:
        "We will be performing scheduled maintenance on our systems from 2:00 AM to 4:00 AM EST. During this time, some services may be temporarily unavailable. We apologize for any inconvenience.",
      type: "warning",
    },
    {
      id: "security",
      title: "Important Security Update",
      message:
        "We have implemented new security measures to better protect your account. Please review your security settings and ensure your contact information is up to date.",
      type: "info",
    },
    {
      id: "feature",
      title: "New Feature Available",
      message:
        "We're excited to announce new features in your banking dashboard! Log in to explore enhanced transaction tracking, improved mobile experience, and more.",
      type: "success",
    },
    {
      id: "verification",
      title: "Account Verification Reminder",
      message:
        "Complete your account verification to unlock all banking features. Upload your required documents in the KYC section of your dashboard.",
      type: "warning",
    },
    {
      id: "welcome",
      title: "Welcome to I&E Bank",
      message:
        "Welcome to I&E Bank! We're thrilled to have you as a customer. Explore your dashboard to discover all the banking services available to you.",
      type: "success",
    },
  ]

  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from("users")
        .select("id, email, first_name, last_name, account_no, status, kyc_status")
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    }
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  const sendNotifications = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and message",
        variant: "destructive",
      })
      return
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one user",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    try {
      // Get account_no for selected users
      const selectedUserData = users.filter((user) => selectedUsers.includes(user.id))

      const notifications = selectedUserData.map((user) => ({
        account_no: user.account_no,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        created_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("notifications").insert(notifications)

      if (error) throw error

      toast({
        title: "Success",
        description: `Notifications sent to ${selectedUsers.length} users`,
      })

      // Reset form
      setNotificationTitle("")
      setNotificationMessage("")
      setNotificationType("info")
      setSelectedUsers([])
    } catch (error) {
      console.error("Error sending notifications:", error)
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.account_no?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const useTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setNotificationTitle(template.title)
    setNotificationMessage(template.message)
    setNotificationType(template.type)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
        <p className="text-gray-600">Send notifications to users and manage communication</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Notification */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <CardDescription>Create and send notifications to selected users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Enter notification title..."
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Enter notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span>Information</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Success</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Warning</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Error</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Badge variant="secondary">{selectedUsers.length} users selected</Badge>
              <Button onClick={sendNotifications} disabled={sending || selectedUsers.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Notifications"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>Use pre-built templates for common notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(template.type)}
                      <span className="font-medium text-sm">{template.title}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => useTemplate(template)}>
                      Use Template
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{template.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
          <CardDescription>Choose which users will receive the notification</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={selectAllUsers}>
              <Users className="h-4 w-4 mr-2" />
              {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">Account: {user.account_no}</p>
                </div>
                <div className="flex space-x-2">
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                  <Badge variant="outline">KYC: {user.kyc_status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
