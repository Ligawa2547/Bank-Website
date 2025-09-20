"use client"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import {
  DollarSign,
  TrendingUp,
  Clock,
  Send,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"

interface Transaction {
  id: string
  transaction_type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "loan_disbursement" | "loan_repayment"
  amount: number
  status: "pending" | "completed" | "failed"
  reference: string
  narration: string
  recipient_account_number?: string
  recipient_name?: string
  sender_account_number?: string
  sender_name?: string
  created_at: string
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.account_no) {
      fetchTransactions()
    }
  }, [profile])

  const fetchTransactions = async () => {
    if (!profile?.account_no) return

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(
          `account_no.eq.${profile.account_no},sender_account_number.eq.${profile.account_no},recipient_account_number.eq.${profile.account_no}`,
        )
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching transactions:", error)
      } else {
        setTransactions(data || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string, isIncoming: boolean) => {
    if (type === "deposit" || isIncoming) {
      return <ArrowDownRight className="h-4 w-4 text-green-600" />
    }
    return <ArrowUpRight className="h-4 w-4 text-red-600" />
  }

  const getTransactionAmount = (transaction: Transaction) => {
    const isIncoming =
      transaction.transaction_type === "deposit" ||
      transaction.transaction_type === "transfer_in" ||
      transaction.recipient_account_number === profile?.account_no

    return isIncoming ? transaction.amount : -transaction.amount
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyIncome = transactions
    .filter((t) => {
      const transactionDate = new Date(t.created_at)
      const isIncoming =
        t.transaction_type === "deposit" ||
        t.transaction_type === "transfer_in" ||
        t.recipient_account_number === profile?.account_no

      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        isIncoming &&
        t.status === "completed"
      )
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDeposits = transactions
    .filter((t) => t.transaction_type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingTransactions = transactions.filter((t) => t.status === "pending").length

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {profile?.first_name || "User"}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your account today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleBalanceVisibility}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-[#0A3D62]">
              {showBalance ? formatCurrency(profile?.account_balance || 0) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      <AccountDetailsCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showBalance ? formatCurrency(profile?.account_balance || 0) : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">Available now</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col gap-2">
              <Link href="/dashboard/transfers">
                <Send className="h-6 w-6" />
                <span className="text-sm">Transfer</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/dashboard/savings">
                <PiggyBank className="h-6 w-6" />
                <span className="text-sm">Savings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/dashboard/loans">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Loans</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Link href="/dashboard/transactions">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">History</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => {
                const amount = getTransactionAmount(transaction)
                const isIncoming = amount > 0

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type, isIncoming)}
                      <div>
                        <p className="font-medium">{transaction.narration}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(transaction.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${isIncoming ? "text-green-600" : "text-red-600"}`}>
                        {isIncoming ? "+" : ""}
                        {formatCurrency(Math.abs(amount))}
                      </p>
                      <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
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
