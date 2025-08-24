"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Copy, RefreshCw, CreditCard, Shield, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface AccountDetailsCardProps {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    account_no: string
    account_balance: number
    verification_status: string | null
    created_at: string
  }
  onRefresh: () => void
}

export function AccountDetailsCard({ user, onRefresh }: AccountDetailsCardProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(user.account_no)
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy account number",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
    toast({
      title: "Account Refreshed",
      description: "Your account details have been updated",
    })
  }

  const getVerificationBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unverified
        </Badge>
      )
    }

    switch (status.toLowerCase()) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Account Details</CardTitle>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Your account information and current balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Balance */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-600">Available Balance</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">
                {showBalance ? formatCurrency(user.account_balance) : "••••••"}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)} className="h-8 w-8 p-0">
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="text-right">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Account Holder</p>
            <p className="text-lg font-semibold">
              {user.first_name} {user.last_name}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Email Address</p>
            <p className="text-sm text-gray-900">{user.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Account Number</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-mono font-semibold">{user.account_no}</p>
              <Button variant="ghost" size="sm" onClick={handleCopyAccountNumber} className="h-8 w-8 p-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Account Status</p>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-gray-600" />
              {getVerificationBadge(user.verification_status)}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium text-gray-600">Member Since</p>
            <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
          </div>
        </div>

        {/* Verification Notice */}
        {(!user.verification_status || user.verification_status !== "verified") && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Account Verification Required</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete your account verification to unlock all features and increase your transaction limits.
                </p>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                  Verify Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
