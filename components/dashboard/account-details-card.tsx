"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Copy, RefreshCw, CreditCard, Shield } from "lucide-react"

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
        title: "Copy failed",
        description: "Could not copy account number",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const getVerificationBadgeVariant = (status: string | null) => {
    if (!status) return "secondary"

    switch (status.toLowerCase()) {
      case "verified":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getVerificationStatus = (status: string | null) => {
    if (!status) return "Not Verified"

    switch (status.toLowerCase()) {
      case "verified":
        return "Verified"
      case "pending":
        return "Pending Verification"
      case "rejected":
        return "Verification Rejected"
      default:
        return status
    }
  }

  return (
    <Card className="w-full">
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
            <p className="text-sm font-medium text-gray-600">Current Balance</p>
            <div className="flex items-center space-x-2">
              <p className="text-3xl font-bold text-gray-900">
                {showBalance ? `$${user.account_balance.toFixed(2)}` : "••••••"}
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
            <p className="text-lg">{user.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Account Number</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-mono">{user.account_no}</p>
              <Button onClick={handleCopyAccountNumber} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Verification Status</p>
            <div className="flex items-center space-x-2">
              <Badge variant={getVerificationBadgeVariant(user.verification_status)}>
                <Shield className="h-3 w-3 mr-1" />
                {getVerificationStatus(user.verification_status)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Account Created</p>
            <p className="text-lg">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
