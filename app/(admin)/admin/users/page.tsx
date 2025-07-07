"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Search, UserX, UserCheck, Mail, Phone, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  account_no: string
  account_balance: number
  status: string
  kyc_status: string
  email_verified: boolean
  phone_verified: boolean
  created_at: string
  last_login: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, email, first_name, last_name, phone_number, account_no, account_balance, status, kyc_status, email_verified, phone_verified, created_at, last_login",
        )
        .order("created_at", { ascending: false })

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

  const updateUserStatus = async (userId: string, newStatus: string) => {
    setProcessing(userId)
    const supabase = createClient()

    try {
      // Get user's account_no for notification
      const user = users.find((u) => u.id === userId)
      if (!user) throw new Error("User not found")

      const { error } = await supabase
        .from("users")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Send notification to user using account_no
      const notificationMessage =
        newStatus === "suspended"
          ? "Your account has been suspended. Please contact support for assistance."
          : newStatus === "active"
            ? "Your account has been reactivated. You now have full access to all features."
            : `Your account status has been updated to ${newStatus}.`

      await supabase.from("notifications").insert({
        account_no: user.account_no,
        title: `Account ${newStatus === "active" ? "Activated" : "Status Updated"}`,
        message: notificationMessage,
        type: newStatus === "suspended" ? "warning" : "info",
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      })

      fetchUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const sendNotificationToUser = async (userId: string, userEmail: string) => {
    const message = prompt("Enter notification message:")
    if (!message) return

    const supabase = createClient()

    try {
      // Get user's account_no for notification
      const user = users.find((u) => u.id === userId)
      if (!user) throw new Error("User not found")

      await supabase.from("notifications").insert({
        account_no: user.account_no,
        title: "Message from Admin",
        message: message,
        type: "info",
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `Notification sent to ${userEmail}`,
      })
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.account_no?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or account number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredUsers.length} users</Badge>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        user.status === "active" ? "default" : user.status === "suspended" ? "destructive" : "secondary"
                      }
                    >
                      {user.status}
                    </Badge>
                    <Badge
                      variant={
                        user.kyc_status === "approved"
                          ? "default"
                          : user.kyc_status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      KYC: {user.kyc_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Number</p>
                    <p className="font-mono">{user.account_no || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Balance</p>
                    <p className="font-semibold text-green-600">{formatCurrency(user.account_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <div className="flex items-center space-x-1">
                      <p>{user.phone_number || "Not provided"}</p>
                      {user.phone_verified && <Phone className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {user.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserStatus(user.id, "suspended")}
                        disabled={processing === user.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        {processing === user.id ? "Suspending..." : "Suspend"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserStatus(user.id, "active")}
                        disabled={processing === user.id}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {processing === user.id ? "Activating..." : "Activate"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => sendNotificationToUser(user.id, user.email)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Notify
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {user.email_verified && <Mail className="h-3 w-3 text-green-500" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500">No users match your current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
