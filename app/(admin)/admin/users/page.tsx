"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Mail, CreditCard, Shield, AlertTriangle } from "lucide-react"

interface AdminUser {
  id: string
  account_no: string
  email: string
  first_name: string
  last_name: string
  phone: string
  account_balance: number
  account_status: string
  verification_status: string
  created_at: string
  updated_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

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

  const updateUserStatus = async (userId: string, field: string, value: string, reason?: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      // Send notification based on the field updated
      const user = users.find((u) => u.id === userId)
      if (user) {
        let notificationType = ""
        if (field === "verification_status") {
          notificationType = "kyc"
          await sendNotification(user.account_no, "kyc", { status: value, reason })
        } else if (field === "account_status") {
          notificationType = "account_status"
          await sendNotification(user.account_no, "account_status", { status: value, reason })
        }
      }

      await fetchUsers()
      toast({
        title: "Success",
        description: `User ${field.replace("_", " ")} updated successfully`,
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const sendNotification = async (accountNo: string, type: string, data: any) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          accountNo,
          ...data,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  const sendCustomNotification = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) return

    setIsSendingNotification(true)
    try {
      await sendNotification(selectedUser.account_no, "general", {
        title: notificationTitle,
        message: notificationMessage,
      })

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      setNotificationTitle("")
      setNotificationMessage("")
      setSelectedUser(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setIsSendingNotification(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.account_no.includes(searchTerm),
  )

  const getStatusBadge = (status: string, type: "account" | "verification") => {
    const colors = {
      account: {
        active: "bg-green-100 text-green-800",
        suspended: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
      },
      verification: {
        verified: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        rejected: "bg-red-100 text-red-800",
        unverified: "bg-gray-100 text-gray-800",
      },
    }

    return (
      <Badge className={colors[type][status as keyof (typeof colors)[typeof type]] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and verification status</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or account number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  {getStatusBadge(user.account_status, "account")}
                  {getStatusBadge(user.verification_status, "verification")}
                </div>
              </div>
              <CardDescription className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Account No.</p>
                  <p className="font-mono">{user.account_no}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-semibold">${user.account_balance?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{user.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                {/* Account Status Update */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Shield className="h-4 w-4 mr-1" />
                      Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Account Status</DialogTitle>
                      <DialogDescription>
                        Change the account status for {user.first_name} {user.last_name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Account Status</Label>
                        <Select
                          onValueChange={(value) => updateUserStatus(user.id, "account_status", value)}
                          defaultValue={user.account_status}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Verification Status Update */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <CreditCard className="h-4 w-4 mr-1" />
                      KYC
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Verification Status</DialogTitle>
                      <DialogDescription>
                        Change the KYC verification status for {user.first_name} {user.last_name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Verification Status</Label>
                        <Select
                          onValueChange={(value) => updateUserStatus(user.id, "verification_status", value)}
                          defaultValue={user.verification_status}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="unverified">Unverified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Send Notification */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Notification</DialogTitle>
                      <DialogDescription>
                        Send a custom notification to {user.first_name} {user.last_name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          placeholder="Notification title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={notificationMessage}
                          onChange={(e) => setNotificationMessage(e.target.value)}
                          placeholder="Notification message"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={sendCustomNotification}
                        disabled={isSendingNotification || !notificationTitle || !notificationMessage}
                        className="w-full"
                      >
                        {isSendingNotification ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Notification"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search criteria" : "No users have been registered yet"}
          </p>
        </div>
      )}
    </div>
  )
}
