"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  account_no: string
  account_balance: number
  verification_status: string
}

interface AccountDetailsCardProps {
  user: User
  onRefresh?: () => void
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
        title: "Copy failed",
        description: "Failed to copy account number",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const getVerificationBadgeVariant = (status: string) => {
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

  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">Account Overview</CardTitle>
            <CardDescription className="text-blue-100">
              {user.first_name} {user.last_name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getVerificationBadgeVariant(user.verification_status)} className="text-xs">
              {user.verification_status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Balance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-sm">Available Balance</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-white hover:bg-white/20 p-1"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-3xl font-bold">{showBalance ? formatCurrency(user.account_balance) : "••••••"}</p>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg">{user.account_no}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAccountNumber}
                className="text-white hover:bg-white/20 p-1"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Account Type</p>
            <p className="font-semibold">Checking Account</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
          <div>
            <p className="text-blue-100 text-sm">This Month</p>
            <p className="font-semibold">$0.00</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Last Transaction</p>
            <p className="font-semibold">--</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
