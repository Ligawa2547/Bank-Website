"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  CreditCard,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import PayPalPayment from "@/components/paypal-payment"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  narration: string
  created_at: string
}

interface DashboardStats {
  totalBalance: number
  totalDeposits: number
  totalWithdrawals: number
  totalTransfers: number
  recentTransactions: Transaction[]
}

export default function DashboardPage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        return
      }

      // Calculate stats
      const totalDeposits =
        transactions
          ?.filter((t) => t.transaction_type === "deposit" && t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0) || 0

      const totalWithdrawals =
        transactions
          ?.filter((t) => t.transaction_type === "withdrawal" && t.status === "completed")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      const totalTransfers =
        transactions
          ?.filter((t) => t.transaction_type.includes("transfer") && t.status === "completed")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

      setStats({
        totalBalance: profile?.balance || 0,
        totalDeposits,
        totalWithdrawals,
        totalTransfers,
        recentTransactions: transactions || [],
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer_out":
        return <Send className="h-4 w-4 text-blue-600" />
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {profile?.first_name || "User"}!</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Here's an overview of your account activity</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowAddMoney(!showAddMoney)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Money
          </Button>
          <Link href="/dashboard/transfers">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Send className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </Link>
        </div>
      </div>

      {/* Add Money Section */}
      {showAddMoney && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Plus className="h-5 w-5 text-green-600" />
              Add Money to Your Account
            </CardTitle>
            <CardDescription className="text-sm">Choose your preferred payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paypal" className="text-xs sm:text-sm">
                  <Wallet className="mr-2 h-4 w-4" />
                  PayPal
                </TabsTrigger>
                <TabsTrigger value="card" className="text-xs sm:text-sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Credit Card
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="mt-4">
                <PayPalPayment
                  type="deposit"
                  onSuccess={() => {
                    if (refreshUserProfile) {
                      refreshUserProfile()
                    }
                    fetchDashboardData()
                    setShowAddMoney(false)
                  }}
                />
              </TabsContent>

              <TabsContent value="card" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <CreditCard className="h-12 w-12 mx-auto text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Credit Card Payments</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Pay securely with your credit or debit card via PayPal
                        </p>
                      </div>
                      <Button onClick={() => {}} disabled={loading} className="w-full">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay with Card
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Available Balance</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl sm:text-3xl font-bold">
                  {balanceVisible ? `$${stats?.totalBalance.toFixed(2) || "0.00"}` : "••••••"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-white hover:bg-blue-500 p-1"
                >
                  {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-xs sm:text-sm">Account Number</p>
              <p className="font-mono text-sm sm:text-base">{profile?.account_number || "Loading..."}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              ${stats?.totalDeposits.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Money added to account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              ${stats?.totalWithdrawals.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Money withdrawn</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              ${stats?.totalTransfers.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Money transferred</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Common banking operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Button
              onClick={() => setShowAddMoney(true)}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Plus className="h-5 w-5 text-green-600" />
              <span className="text-xs sm:text-sm">Add Money</span>
            </Button>

            <Link href="/dashboard/transfers" className="w-full">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-transparent">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Transfer</span>
              </Button>
            </Link>

            <Link href="/dashboard/statements" className="w-full">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-transparent">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-xs sm:text-sm">Statements</span>
              </Button>
            </Link>

            <Link href="/dashboard/transactions" className="w-full">
              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4 w-full bg-transparent">
                <RefreshCw className="h-5 w-5 text-orange-600" />
                <span className="text-xs sm:text-sm">History</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-sm">Your latest account activity</CardDescription>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base capitalize truncate">
                        {transaction.transaction_type.replace("_", " ")}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{transaction.narration}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className="font-medium text-sm sm:text-base">
                      {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <Badge className={`${getStatusColor(transaction.status)} text-xs`}>{transaction.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
