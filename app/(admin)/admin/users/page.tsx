"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Search, UserX, UserCheck, Mail, Phone, Calendar, Shield, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  verification_status: string
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
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log("Fetching users from database...")

      // Fetch from users table with all columns
      const { data, error, count } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })

      console.log("Query result:", { data, error, count })

      if (error) {
        console.error("Error fetching users:", error)
        throw error
      }

      if (!data) {
        console.log("No data returned from users table")
        setUsers([])
        return
      }

      console.log(`Found ${data.length} users:`, data)

      // Map the data to ensure all fields are properly handled
      const mappedUsers = data.map((user: any) => ({
        id: user.id || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        account_no: user.account_no || "",
        account_balance: Number.parseFloat(user.account_balance) || 0,
        status: user.status || "pending",
        kyc_status: user.kyc_status || "not_submitted",
        verification_status: user.verification_status || "pending",
        email_verified: user.email_verified || false,
        phone_verified: user.phone_verified || false,
        created_at: user.created_at || new Date().toISOString(),
        last_login: user.last_login || "",
      }))

      setUsers(mappedUsers)
      console.log("Mapped users:", mappedUsers)
    } catch (error) {
      console.error("Error in fetchUsers:", error)
      toast({
        title: "Error",
        description: `Failed to fetch users: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, newStatus: string) => {
    setProcessing(userId)

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
        is_read: false,
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

  const updateVerificationStatus = async (userId: string, newVerificationStatus: string) => {
    setProcessing(userId)

    try {
      // Get user's account_no for notification
      const user = users.find((u) => u.id === userId)
      if (!user) throw new Error("User not found")

      const { error } = await supabase
        .from("users")
        .update({
          verification_status: newVerificationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Send notification to user using account_no
      const notificationMessage =
        newVerificationStatus === "verified"
          ? "Congratulations! Your account has been verified. You now have full access to all banking features."
          : newVerificationStatus === "rejected"
            ? "Your account verification has been rejected. Please contact support for more information."
            : `Your account verification status has been updated to ${newVerificationStatus}.`

      await supabase.from("notifications").insert({
        account_no: user.account_no,
        title: `Account ${newVerificationStatus === "verified" ? "Verified" : "Verification Status Updated"}`,
        message: notificationMessage,
        type:
          newVerificationStatus === "verified" ? "success" : newVerificationStatus === "rejected" ? "warning" : "info",
        is_read: false,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Success",
        description: `Verification status updated to ${newVerificationStatus}`,
      })

      fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error("Error updating verification status:", error)
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const sendNotificationToUser = async (userId: string, userEmail: string) => {
    const message = prompt("Enter notification message:")
    if (!message) return

    try {
      // Get user's account_no for notification
      const user = users.find((u) => u.id === userId)
      if (!user) throw new Error("User not found")

      await supabase.from("notifications").insert({
        account_no: user.account_no,
        title: "Message from Admin",
        message: message,
        type: "info",
        is_read: false,
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
    const matchesVerification = verificationFilter === "all" || user.verification_status === verificationFilter

    return matchesSearch && matchesStatus && matchesVerification
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts, verification status, and permissions</p>
      </div>

      {/* Status Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Users Overview:</strong> Found {users.length} users in database
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-blue-600">
            <span>Verified: {users.filter((u) => u.verification_status === "verified").length}</span>
            <span>Pending: {users.filter((u) => u.verification_status === "pending").length}</span>
            <span>Rejected: {users.filter((u) => u.verification_status === "rejected").length}</span>
            <span>Active: {users.filter((u) => u.status === "active").length}</span>
            <span>Suspended: {users.filter((u) => u.status === "suspended").length}</span>
          </div>
          {users.length === 0 && (
            <div className="mt-2">
              <p className="text-sm text-blue-700">If you don't see any users, check:</p>
              <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                <li>Users have been created through the signup process</li>
                <li>The users table exists in your Supabase database</li>
                <li>Row Level Security policies allow reading user data</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
                    {getVerificationStatusBadge(user.verification_status)}
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
                    {/* Account Status Actions */}
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

                    {/* Verification Status Actions */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          {getVerificationIcon(user.verification_status)}
                          <span className="ml-2">Verification</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Verification Status</DialogTitle>
                          <DialogDescription>
                            Change the verification status for {user.first_name} {user.last_name}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Current Status</label>
                                <div className="flex items-center space-x-2 mt-1">
                                  {getVerificationIcon(selectedUser.verification_status)}
                                  {getVerificationStatusBadge(selectedUser.verification_status)}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Account Details</label>
                                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                                <p className="text-sm text-gray-600">{selectedUser.account_no}</p>
                              </div>
                            </div>

                            <div className="flex space-x-2 pt-4">
                              {selectedUser.verification_status !== "verified" && (
                                <Button
                                  onClick={() => updateVerificationStatus(selectedUser.id, "verified")}
                                  disabled={processing === selectedUser.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {processing === selectedUser.id ? "Verifying..." : "Verify Account"}
                                </Button>
                              )}

                              {selectedUser.verification_status !== "rejected" && (
                                <Button
                                  onClick={() => updateVerificationStatus(selectedUser.id, "rejected")}
                                  disabled={processing === selectedUser.id}
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {processing === selectedUser.id ? "Rejecting..." : "Reject"}
                                </Button>
                              )}

                              {selectedUser.verification_status !== "pending" && (
                                <Button
                                  onClick={() => updateVerificationStatus(selectedUser.id, "pending")}
                                  disabled={processing === selectedUser.id}
                                  variant="outline"
                                  className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  {processing === selectedUser.id ? "Setting..." : "Set Pending"}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

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
              <p className="text-gray-500 mb-4">
                {users.length === 0
                  ? "No users exist in the database yet. Users will appear here after they sign up."
                  : "No users match your current filters."}
              </p>
              <Button onClick={fetchUsers} variant="outline">
                Refresh Users
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
