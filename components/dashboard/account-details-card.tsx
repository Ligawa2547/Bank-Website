"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, CreditCard, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function AccountDetailsCard() {
  const { profile } = useAuth()
  const [showBalance, setShowBalance] = useState(true)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getKycStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        )
    }
  }

  const getAccountStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Account Details</CardTitle>
        <CreditCard className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Balance */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-blue-900">
              {showBalance ? formatCurrency(profile.account_balance || 0) : "••••••"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBalance(!showBalance)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-semibold">{profile.account_no || "Not Available"}</p>
              {profile.account_no && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(profile.account_no!, "Account number")}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Account Holder</p>
            <p className="text-lg font-semibold">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.email || "Not Available"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Account Status</p>
            {getAccountStatusBadge(profile.status)}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">KYC Status</p>
            {getKycStatusBadge(profile.kyc_status)}
          </div>
        </div>

        {/* Verification Status */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Verification Status</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={profile.email_verified ? "default" : "secondary"} className="flex items-center gap-1">
              {profile.email_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              Email {profile.email_verified ? "Verified" : "Unverified"}
            </Badge>
            <Badge variant={profile.phone_verified ? "default" : "secondary"} className="flex items-center gap-1">
              {profile.phone_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              Phone {profile.phone_verified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        {/* Security Notice */}
        {(!profile.email_verified || !profile.phone_verified || profile.kyc_status !== "approved") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Complete Your Account Setup</p>
                <p className="text-sm text-yellow-700 mt-1">
                  To ensure full account functionality and security, please complete email verification, phone
                  verification, and KYC submission.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
