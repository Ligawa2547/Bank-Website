"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { PayPalPayment } from "@/components/paypal-payment"
import {
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  account_no: string
  account_balance: number
  verification_status: string | null
  created_at: string
}

interface Transaction {
  id: string
  user_id: string
  account_no: string
  transaction_type: string
  amount: number
  balance_after: number
  narration: string
  reference: string
  status: string
  created_at: string
  sender_name?: string
  recipient_name?: string
}

interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  totalTransactions: number
  pendingTransactions: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const supabase = createClientComponentClient()

  const fetchDashboardData = async () => {
    try {
      setError("")

      // Get current user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        throw new Error("Not authenticated")
      }

      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (userError) {
        throw new Error(`Error fetching user data: ${userError.message}`)
      }

      setUser(userData)

      // Get transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (transactionError) {
        throw new Error(`Error fetching transactions: ${transactionError.message}`)
      }

      setTransactions(transactionData || [])

      // Calculate stats from transaction data
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const monthlyTransactions = transactionData?.filter((t) => {
        const transactionDate = new Date(t.created_at)
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
      })

      const monthlyIncome =
        monthlyTransactions
          ?.filter((t) => t.transaction_type === "deposit" && t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0) || 0

      const pendingCount = transactionData?.filter((t) => t.status === "pending").length || 0

      setStats({
        totalBalance: userData.account_balance || 0,
        monthlyIncome,
        totalTransactions: transactionData?.length || 0,
        pendingTransactions: pendingCount,
      })
    } catch (error) {
      console.error("Dashboard data error:", error)
      setError(error instanceof Error ? error.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    toast({
      title: "Dashboard Refreshed",
      description: "Your account data has been updated",
    })
  }

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your account balance will be updated shortly",
    })
    handleRefresh()
  }

  useEffect(() => {
    fetchDashboardData()

    // Check for URL parameters (payment success/error)
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get("success")
    const error = urlParams.get("error")
    const cancelled = urlParams.get("cancelled")

    if (success === "payment_completed") {
      toast({
        title: "Payment Successful!",
        description: "Your deposit has been completed successfully",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment",
        variant: "destructive",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (cancelled === "true") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled",
        variant: "destructive",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [toast])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const isNegative = type === "withdrawal" || type === "transfer_out" || amount < 0
    const absAmount = Math.abs(amount)
    return `${isNegative ? "-" : "+"}$${absAmount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-gray-600">Here's what's happening with your account today.</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Account Details */}
      {user && <AccountDetailsCard user={user} onRefresh={handleRefresh} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current account balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month's deposits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Pending transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest account activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium">{transaction.narration}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()} •{" "}
                            {transaction.transaction_type.replace("_", " ").toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatAmount(transaction.amount, transaction.transaction_type)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PayPal Payments */}
        <div>
          <PayPalPayment onSuccess={handlePaymentSuccess} />
        </div>
      </div>
    </div>
  )
}
