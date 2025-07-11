"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  Send,
  Building2,
  Bell,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import type { Transaction, Notification } from "@/types/user"

export default function DashboardPage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0,
  })
  const supabase = createClientComponentClient()

  // Function to refresh balance and data
  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      await refreshUserProfile()
      await fetchDashboardData()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchDashboardData = async () => {
    if (!user || !profile?.account_number) {
      setIsLoading(false)
      return
    }

    try {
      console.log("Fetching dashboard data for account:", profile.account_number)

      // Fetch recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number}`)
        .order("created_at", { ascending: false })
        .limit(5)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
      } else if (transactions) {
        console.log("Fetched transactions:", transactions.length)
        // Process transactions to show correct perspective
        const processedTransactions = transactions.map((transaction) => {
          const processed = { ...transaction }
          if (transaction.sender_account_number === profile.account_number) {
            processed.transaction_type = "transfer_out"
          } else if (transaction.recipient_account_number === profile.account_number) {
            processed.transaction_type = "transfer_in"
          }
          return processed
        })
        setRecentTransactions(processedTransactions)
      }

      // Fetch recent notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .eq("account_no", profile.account_number)
        .order("created_at", { ascending: false })
        .limit(3)

      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError)
      } else if (notifications) {
        setRecentNotifications(notifications)
      }

      // Calculate monthly statistics
      const currentMonth = new Date()
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

      const { data: monthlyTransactions, error: monthlyError } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number}`)
        .gte("created_at", firstDayOfMonth.toISOString())
        .eq("status", "completed")

      if (monthlyError) {
        console.error("Error fetching monthly stats:", monthlyError)
      } else if (monthlyTransactions) {
        let totalIncome = 0
        let totalExpenses = 0

        monthlyTransactions.forEach((transaction) => {
          if (
            transaction.transaction_type === "deposit" ||
            (transaction.transaction_type === "transfer_in" &&
              transaction.recipient_account_number === profile.account_number) ||
            transaction.transaction_type === "loan_disbursement"
          ) {
            totalIncome += transaction.amount
          } else if (
            transaction.transaction_type === "withdrawal" ||
            (transaction.transaction_type === "transfer_out" &&
              transaction.sender_account_number === profile.account_number) ||
            transaction.transaction_type === "loan_repayment"
          ) {
            totalExpenses += transaction.amount
          }
        })

        setMonthlyStats({
          totalIncome,
          totalExpenses,
          transactionCount: monthlyTransactions.length,
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDashboardData()
      setIsLoading(false)
    }

    if (profile?.account_number) {
      loadData()
    }
  }, [user, profile, supabase])

  const formatCurrency = (amount: number) => {
    // Ensure amount is a valid number
    const numAmount = typeof amount === "number" ? amount : Number.parseFloat(amount) || 0
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(numAmount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "loan_disbursement":
        return <Building2 className="h-4 w-4 text-blue-600" />
      case "loan_repayment":
        return <CreditCard className="h-4 w-4 text-orange-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.transaction_type === "deposit") {
      return transaction.narration || "Account deposit"
    } else if (transaction.transaction_type === "withdrawal") {
      return transaction.narration || "Account withdrawal"
    } else if (transaction.transaction_type === "transfer_in") {
      return `From ${transaction.sender_name || "Unknown"}`
    } else if (transaction.transaction_type === "transfer_out") {
      return `To ${transaction.recipient_name || "Unknown"}`
    } else if (transaction.transaction_type === "loan_disbursement") {
      return "Loan disbursement"
    } else if (transaction.transaction_type === "loan_repayment") {
      return "Loan payment"
    }
    return transaction.narration || "Transaction"
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your dashboard</p>
        </div>
      </div>
    )
  }

  // Log the current balance for debugging
  console.log("Dashboard rendering with profile balance:", profile.balance, "type:", typeof profile.balance)

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {profile.first_name || "User"}!</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your account today.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/transfers" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Money
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/transfers?tab=deposit" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Money
            </Link>
          </Button>
        </div>
      </div>

      {/* Account Balance Card */}
      <Card className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Current Balance</p>
              <div className="flex items-center gap-3 mt-2">
                {showBalance ? (
                  <p className="text-3xl font-bold">{formatCurrency(profile.balance || 0)}</p>
                ) : (
                  <p className="text-3xl font-bold">••••••</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20 p-1"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-blue-100 text-sm mt-1">Account: {profile.account_number}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">This Month</p>
              <p className="text-lg font-semibold text-green-300">
                +{formatCurrency(monthlyStats.totalIncome - monthlyStats.totalExpenses)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money In (This Month)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyStats.totalIncome)}</p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money Out (This Month)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyStats.totalExpenses)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyStats.transactionCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activities</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">{getTransactionIcon(transaction.transaction_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{getTransactionDescription(transaction)}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                    <p
                      className={`font-semibold text-sm ${
                        transaction.transaction_type === "deposit" ||
                        transaction.transaction_type === "transfer_in" ||
                        transaction.transaction_type === "loan_disbursement"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.transaction_type === "deposit" ||
                      transaction.transaction_type === "transfer_in" ||
                      transaction.transaction_type === "loan_disbursement"
                        ? "+"
                        : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Important updates and alerts</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/notifications">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mt-1" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <Bell className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent notifications</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/transfers">
                <Send className="h-6 w-6" />
                <span className="text-sm">Send Money</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/transfers?tab=deposit">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Add Money</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/loans">
                <Building2 className="h-6 w-6" />
                <span className="text-sm">Apply for Loan</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/transactions">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">View Statements</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
