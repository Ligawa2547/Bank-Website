"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { Copy, Eye, EyeOff, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function AccountDetailsCard() {
  const { profile } = useAuth()
  const [showBalance, setShowBalance] = useState(true)
  const { toast } = useToast()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getKYCBadge = (status: string) => {
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
            <Clock className="h-3 w-3 mr-1" />
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

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Account Details
          <div className="flex items-center gap-2">
            {getStatusBadge(profile.status)}
            {getKYCBadge(profile.kyc_status)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Account Holder</label>
              <p className="text-lg font-semibold">
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile.email || "Not Available"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Account Number</label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-semibold">{profile.account_no || "Not Available"}</p>
                {profile.account_no && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(profile.account_no!, "Account number")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <div className="flex items-center gap-2">
                <p className="text-lg">{profile.email || "Not Available"}</p>
                {profile.email_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <div className="flex items-center gap-2">
                <p className="text-lg">{profile.phone_number || "Not Available"}</p>
                {profile.phone_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Balance Information */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-500">Available Balance</label>
                <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-3xl font-bold text-[#0A3D62]">
                {showBalance ? formatCurrency(profile.account_balance || 0) : "••••••"}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Account Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Account Status:</span>
                  <span className="capitalize font-medium">{profile.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>KYC Status:</span>
                  <span className="capitalize font-medium">{profile.kyc_status.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email Verified:</span>
                  <span className="font-medium">{profile.email_verified ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone Verified:</span>
                  <span className="font-medium">{profile.phone_verified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
