"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Eye,
  EyeOff,
  CreditCard,
  Send,
  History,
  FileText,
  Shield,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react"

interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  city: string
  country: string
  account_no: string
  account_balance: number
  status: string
  email_verified: boolean
  phone_verified: boolean
  kyc_status: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBalance, setShowBalance] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching user data:", error)
          setError("Failed to load user data")
          return
        }

        setUserData(data)
      } catch (err: any) {
        console.error("Error fetching user data:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-lg">Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!userData) {
    return (
      <Alert className="max-w-md mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Found</AlertTitle>
        <AlertDescription>Your account data is being set up. Please try refreshing the page.</AlertDescription>
      </Alert>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatAccountNumber = (accountNo: string) => {
    // Format 12-digit account number with spaces for readability
    return accountNo.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
  }

  const accountAge = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userData.first_name || "Valued Customer"}!</h1>
        <p className="text-blue-100">Here's your account overview for today</p>
      </div>

      {/* Account Alerts */}
      {!userData.email_verified && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Email Verification Required</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Please check your email and click the verification link to secure your account.
          </AlertDescription>
        </Alert>
      )}

      {userData.kyc_status === "not_submitted" && (
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Complete Your KYC Verification</AlertTitle>
          <AlertDescription className="text-blue-700">
            Submit your identity documents to unlock all banking features and increase your transaction limits.
          </AlertDescription>
        </Alert>
      )}

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Balance */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Account Balance</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
              className="h-8 w-8 text-green-600 hover:bg-green-200"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {showBalance ? `$${userData.account_balance.toLocaleString()}` : "••••••"}
            </div>
            <p className="text-xs text-green-700 mt-1">Available balance</p>
          </CardContent>
        </Card>

        {/* Account Number */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Account Number</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-mono font-bold text-blue-900">{formatAccountNumber(userData.account_no)}</div>
            <p className="text-xs text-blue-700 mt-1">Your unique account identifier</p>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Account Status</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(userData.status)} mb-2`}>
              {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
            </Badge>
            <p className="text-xs text-purple-700">Account opened {accountAge} days ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information & Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-base font-semibold">
                  {userData.first_name} {userData.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base">{userData.email}</p>
              </div>
            </div>

            {userData.phone_number && (
              <div>
                <p className="text-sm font-medium text-gray-500">Phone Number</p>
                <p className="text-base">{userData.phone_number}</p>
              </div>
            )}

            {(userData.city || userData.country) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base">{[userData.city, userData.country].filter(Boolean).join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Verification
            </CardTitle>
            <CardDescription>Your account security status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Verification</span>
              <div className="flex items-center gap-2">
                {userData.email_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <Badge
                  className={userData.email_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                >
                  {userData.email_verified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Phone Verification</span>
              <div className="flex items-center gap-2">
                {userData.phone_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
                <Badge
                  className={userData.phone_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {userData.phone_verified ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">KYC Status</span>
              <Badge className={getKycStatusColor(userData.kyc_status)}>
                {userData.kyc_status.replace("_", " ").charAt(0).toUpperCase() +
                  userData.kyc_status.replace("_", " ").slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common banking tasks and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Send className="h-6 w-6" />
              <span className="text-sm">Send Money</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <History className="h-6 w-6" />
              <span className="text-sm">Transactions</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <DollarSign className="h-6 w-6" />
              <span className="text-sm">Apply for Loan</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <FileText className="h-6 w-6" />
              <span className="text-sm">KYC Documents</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
