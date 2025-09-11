"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Transaction } from "@/types/user"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  FileText,
  HelpCircle,
  CreditCard,
  Building2,
  Banknote,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile?.account_number) {
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      try {
        console.log("Fetching dashboard data for account:", profile.account_number)

        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},account_no.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })
          .limit(5)

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError)
        } else {
          console.log(`Found ${transactionsData?.length || 0} recent transactions`)
          setTransactions(transactionsData || [])
        }

        // Calculate stats
        const { data: allTransactions, error: statsError } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},account_no.eq.${profile.account_number}`,
          )

        if (statsError) {
          console.error("Error fetching stats:", statsError)
        } else {
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()

          const deposits =
            allTransactions?.filter(
              (t) =>
                t.transaction_type === "deposit" ||
                (t.transaction_type === "transfer_in" && t.recipient_account_number === profile.account_number) ||
                t.transaction_type === "loan_disbursement",
            ) || []

          const withdrawals =
            allTransactions?.filter(
              (t) =>
                t.transaction_type === "withdrawal" ||
                (t.transaction_type === "transfer_out" && t.sender_account_number === profile.account_number) ||
                t.transaction_type === "loan_repayment",
            ) || []

          const pending = allTransactions?.filter((t) => t.status === "pending") || []

          const monthlyIncome =
            allTransactions
              ?.filter((t) => {
                const transactionDate = new Date(t.created_at)
                return (
                  transactionDate.getMonth() === currentMonth &&
                  transactionDate.getFullYear() === currentYear &&
                  (t.transaction_type === "deposit" ||
                    (t.transaction_type === "transfer_in" && t.recipient_account_number === profile.account_number) ||
                    t.transaction_type === "loan_disbursement")
                )
              })
              .reduce((sum, t) => sum + t.amount, 0) || 0

          const monthlyExpenses =
            allTransactions
              ?.filter((t) => {
                const transactionDate = new Date(t.created_at)
                return (
                  transactionDate.getMonth() === currentMonth &&
                  transactionDate.getFullYear() === currentYear &&
                  (t.transaction_type === "withdrawal" ||
                    (t.transaction_type === "transfer_out" && t.sender_account_number === profile.account_number) ||
                    t.transaction_type === "loan_repayment")
                )
              })
              .reduce((sum, t) => sum + t.amount, 0) || 0

          setStats({
            totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
            totalWithdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
            pendingTransactions: pending.length,
            monthlyIncome,
            monthlyExpenses,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, profile, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
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
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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
        return <Banknote className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.transaction_type === "deposit") {
      return transaction.narration || "Account deposit"
    } else if (transaction.transaction_type === "withdrawal") {
      return transaction.narration || "Account withdrawal"
    } else if (transaction.transaction_type === "transfer_in") {
      const senderName = transaction.sender_name || "Unknown sender"
      return `From ${senderName}`
    } else if (transaction.transaction_type === "transfer_out") {
      const recipientName = transaction.recipient_name || "Unknown recipient"
      return `To ${recipientName}`
    } else if (transaction.transaction_type === "loan_disbursement") {
      return transaction.narration || "Loan disbursement"
    } else if (transaction.transaction_type === "loan_repayment") {
      return transaction.narration || "Loan repayment"
    }
    return transaction.narration || "Transaction"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62] mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] text-white rounded-lg p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {profile.first_name}!</h1>
        <p className="text-blue-100">Here's an overview of your account activity and balance.</p>
      </div>

      {/* Account Balance Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-6 w-6 text-green-600" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600 mb-2">{formatCurrency(profile.balance || 0)}</div>
          <p className="text-gray-600">Available Balance</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium text-sm">{getTransactionDescription(transaction)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(transaction.status)}
                            <span className="text-xs text-gray-500">{formatDate(transaction.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
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
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <Link href="/dashboard/transactions">
                      <Button variant="outline" className="w-full bg-transparent">
                        View All Transactions
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                  <p className="text-sm">Start by making a deposit or transfer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Details & Quick Actions */}
        <div className="space-y-6">
          <AccountDetailsCard />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common banking tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/transfers">
                <Button className="w-full justify-start bg-[#0A3D62] hover:bg-[#0F5585]">
                  <Send className="h-4 w-4 mr-2" />
                  Send Money & Deposits
                </Button>
              </Link>
              <Link href="/dashboard/transactions">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
              </Link>
              <Link href="/dashboard/statements">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Statements
                </Button>
              </Link>
              <Link href="/dashboard/support">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
