"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { PayPalPayment } from "@/components/paypal-payment"
import { ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  account_no: string
  account_balance: number
  verification_status: string | null
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  narration: string
  status: string
  created_at: string
  reference: string
  recipient_name?: string
  sender_name?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()

    // Check for payment success/error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("success") === "payment_completed") {
      toast({
        title: "Payment Successful!",
        description: "Your deposit has been processed and added to your account.",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard")
    } else if (urlParams.get("error")) {
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard")
    } else if (urlParams.get("cancelled") === "true") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled.",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [toast])

  const fetchDashboardData = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        console.error("Auth error:", authError)
        return
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, account_no, account_balance, verification_status")
        .eq("id", authUser.id)
        .single()

      if (userError) {
        console.error("Error fetching user:", userError)
      } else {
        setUser(userData)
      }

      // Fetch recent transactions using correct column name
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, transaction_type, amount, narration, status, created_at, reference, recipient_name, sender_name")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError)
      } else {
        setTransactions(transactionData || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case "loan_disbursement":
        return <ArrowDownLeft className="h-4 w-4 text-purple-600" />
      case "loan_repayment":
        return <ArrowUpRight className="h-4 w-4 text-purple-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "cancelled":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "transfer_in":
        return "Money Received"
      case "transfer_out":
        return "Money Sent"
      case "loan_disbursement":
        return "Loan Disbursement"
      case "loan_repayment":
        return "Loan Payment"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  const getTransactionAmount = (transaction: Transaction) => {
    const isIncoming = ["deposit", "transfer_in", "loan_disbursement"].includes(transaction.transaction_type)
    return {
      amount: transaction.amount,
      isPositive: isIncoming,
      sign: isIncoming ? "+" : "-",
      color: isIncoming ? "text-green-600" : "text-red-600",
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load dashboard</h1>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.first_name}!</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(user.account_balance)}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Recent transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.filter((t) => t.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground">Pending transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                transactions
                  .filter((t) => {
                    const transactionDate = new Date(t.created_at)
                    const now = new Date()
                    return (
                      transactionDate.getMonth() === now.getMonth() &&
                      transactionDate.getFullYear() === now.getFullYear() &&
                      ["deposit", "transfer_in"].includes(t.transaction_type) &&
                      t.status === "completed"
                    )
                  })
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">Monthly income</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Details */}
        <div className="lg:col-span-1">
          <AccountDetailsCard user={user} onRefresh={fetchDashboardData} />
        </div>

        {/* PayPal Payment */}
        <div className="lg:col-span-2">
          <PayPalPayment onSuccess={fetchDashboardData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest account activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const amountInfo = getTransactionAmount(transaction)
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium">{transaction.narration}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.created_at)} • {getTransactionTypeLabel(transaction.transaction_type)}
                        </p>
                        {transaction.recipient_name && (
                          <p className="text-xs text-gray-400">To: {transaction.recipient_name}</p>
                        )}
                        {transaction.sender_name && (
                          <p className="text-xs text-gray-400">From: {transaction.sender_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${amountInfo.color}`}>
                        {amountInfo.sign}
                        {formatCurrency(amountInfo.amount)}
                      </p>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
