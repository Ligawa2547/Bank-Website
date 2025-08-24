"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { PayPalPayment } from "@/components/paypal-payment"
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  CreditCard,
  PiggyBank,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  narration: string
  created_at: string
  recipient_name?: string
  recipient_account_number?: string
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  account_no: string
  account_balance: number
  verification_status: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
    fetchTransactions()

    // Check for URL parameters (success/error messages)
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get("success")
    const errorParam = urlParams.get("error")
    const info = urlParams.get("info")

    if (success === "payment_completed") {
      toast({
        title: "Payment Successful",
        description: "Your payment has been completed successfully.",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh data
      setTimeout(() => {
        fetchUserData()
        fetchTransactions()
      }, 1000)
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        missing_parameters: "Payment failed due to missing parameters.",
        transaction_not_found: "Transaction not found.",
        payment_not_approved: "Payment was not approved.",
        payment_execution_failed: "Payment execution failed.",
        internal_error: "An internal error occurred.",
        cancel_error: "Error processing payment cancellation.",
      }

      toast({
        title: "Payment Error",
        description: errorMessages[errorParam] || "An error occurred during payment.",
        variant: "destructive",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (info === "payment_cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled.",
        variant: "destructive",
      })
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [toast])

  const fetchUserData = async () => {
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError || !session) {
        setError("Please log in to view your dashboard")
        return
      }

      const { data, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, account_no, account_balance, verification_status")
        .eq("id", session.user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        setError("Failed to load user data")
        return
      }

      setUser(data)
    } catch (error) {
      console.error("Error in fetchUserData:", error)
      setError("An error occurred while loading your data")
    }
  }

  const fetchTransactions = async () => {
    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError || !session) return

      const { data, error: transactionError } = await supabase
        .from("transactions")
        .select("id, transaction_type, amount, status, narration, created_at, recipient_name, recipient_account_number")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (transactionError) {
        console.error("Error fetching transactions:", transactionError)
        return
      }

      setTransactions(data || [])
    } catch (error) {
      console.error("Error in fetchTransactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <X className="h-4 w-4 text-red-500" />
      case "cancelled":
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>User data not found. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.first_name} {user.last_name}
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your account today.</p>
        </div>
        {user.verification_status !== "verified" && (
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account is not fully verified. Complete your KYC to unlock all features.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Account Details */}
      <AccountDetailsCard user={user} onRefresh={fetchUserData} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Transfer</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Send Money</div>
            <p className="text-xs text-muted-foreground">Transfer to other accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pay Bills</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bill Pay</div>
            <p className="text-xs text-muted-foreground">Pay your bills online</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Save More</div>
            <p className="text-xs text-muted-foreground">Open savings account</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Invest</div>
            <p className="text-xs text-muted-foreground">Grow your wealth</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Your latest account activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {transaction.transaction_type === "deposit" ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.narration}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                          {transaction.recipient_name && (
                            <p className="text-sm text-muted-foreground">To: {transaction.recipient_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p
                            className={`font-semibold ${
                              transaction.transaction_type === "deposit" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.transaction_type === "deposit" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(transaction.status)}
                            <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PayPal Payment */}
        <div>
          <PayPalPayment
            onSuccess={() => {
              fetchUserData()
              fetchTransactions()
            }}
          />
        </div>
      </div>
    </div>
  )
}
