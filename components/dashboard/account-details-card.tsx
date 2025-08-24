"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, RefreshCw, CreditCard, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AccountDetailsCardProps {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    account_no: string
    account_balance: number
    verification_status: string | null
  }
  onRefresh: () => void
}

export function AccountDetailsCard({ user, onRefresh }: AccountDetailsCardProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(user.account_no)
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy account number",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  const getVerificationBadgeVariant = (status: string | null) => {
    if (!status) return "outline"

    switch (status.toLowerCase()) {
      case "verified":
      case "approved":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      case "not_submitted":
        return "outline"
      default:
        return "outline"
    }
  }

  const getVerificationStatus = (status: string | null) => {
    if (!status) return "Not Verified"

    switch (status.toLowerCase()) {
      case "verified":
      case "approved":
        return "Verified"
      case "pending":
        return "Pending"
      case "rejected":
        return "Rejected"
      case "not_submitted":
        return "Not Submitted"
      default:
        return "Unknown"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Account Details</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Your account information and current balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Available Balance</span>
            <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {showBalance ? formatCurrency(user.account_balance) : "••••••"}
          </div>
        </div>

        {/* Account Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Number</p>
                <p className="text-sm text-gray-600">{user.account_no}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyAccountNumber}>
              <CreditCard className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Holder</p>
                <p className="text-sm text-gray-600">
                  {user.first_name} {user.last_name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Verification Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getVerificationBadgeVariant(user.verification_status)} className="text-xs">
                    {getVerificationStatus(user.verification_status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full bg-transparent">
            <CreditCard className="h-4 w-4 mr-2" />
            Transfer
          </Button>
          <Button variant="outline" className="w-full bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
