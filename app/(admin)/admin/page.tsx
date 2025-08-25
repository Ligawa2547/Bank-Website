"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, FileCheck, CreditCard, DollarSign, TrendingUp, AlertTriangle, XCircle } from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"

interface DashboardStats {
  totalUsers: number
  pendingKyc: number
  suspendedAccounts: number
  totalBalance: number
  todayTransactions: number
  failedTransactions: number
}

interface RecentTransaction {
  id: string
  amount: number
  transaction_type: string
  status: string
  created_at: string
  account_no: string
  recipient_account_number: string
  narration: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingKyc: 0,
    suspendedAccounts: 0,
    totalBalance: 0,
    todayTransactions: 0,
    failedTransactions: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log("Fetching dashboard data...")

      // Fetch dashboard statistics manually since the function might not exist
      const [usersResult, transactionsResult] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(10),
      ])

      console.log("Users result:", usersResult)
      console.log("Transactions result:", transactionsResult)

      if (usersResult.error) {
        console.error("Error fetching users:", usersResult.error)
        throw usersResult.error
      }

      if (transactionsResult.error) {
        console.error("Error fetching transactions:", transactionsResult.error)
        throw transactionsResult.error
      }

      const users = usersResult.data || []
      const transactions = transactionsResult.data || []

      // Calculate stats manually
      const today = new Date().toISOString().split("T")[0]
      const todayTransactions = transactions.filter(
        (t) => t.created_at?.startsWith(today) && t.status === "completed",
      ).length

      const failedTransactions = transactions.filter(
        (t) => t.created_at?.startsWith(today) && t.status === "failed",
      ).length

      const totalBalance = users.reduce((sum, user) => {
        const balance = Number.parseFloat(user.account_balance) || 0
        return sum + balance
      }, 0)

      const calculatedStats: DashboardStats = {
        totalUsers: users.length,
        pendingKyc: users.filter((u) => u.kyc_status === "pending").length,
        suspendedAccounts: users.filter((u) => u.status === "suspended").length,
        totalBalance: totalBalance,
        todayTransactions: todayTransactions,
        failedTransactions: failedTransactions,
      }

      console.log("Calculated stats:", calculatedStats)
      setStats(calculatedStats)
      setRecentTransactions(transactions)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: `Failed to load dashboard data: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
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
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-full">
      <div className="px-2 lg:px-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm lg:text-base text-gray-600">Overview of your banking system</p>
      </div>

      {/* Debug Info */}
      <Card className="bg-blue-50 border-blue-200 mx-2 lg:mx-0">
        <CardContent className="pt-4 lg:pt-6">
          <p className="text-xs lg:text-sm text-blue-800">
            <strong>System Status:</strong> Found {stats.totalUsers} users and {recentTransactions.length} recent
            transactions
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4 px-2 lg:px-0">
        <Card className="p-3 lg:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Users</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="p-3 lg:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium">Pending KYC</CardTitle>
            <FileCheck className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-yellow-600">{stats.pendingKyc}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="p-3 lg:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-600">{stats.suspendedAccounts}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="p-3 lg:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 lg:p-6">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-sm lg:text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">System-wide balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-2 px-2 lg:px-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 lg:p-6">
            <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.todayTransactions}</div>
            <p className="text-xs text-muted-foreground">Successful transactions today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 lg:p-6">
            <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
            <p className="text-xs text-muted-foreground">Failed transactions today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mx-2 lg:mx-0">
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="text-lg lg:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm">Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0">
          <div className="grid gap-3 lg:gap-4 grid-cols-1 md:grid-cols-3">
            <Button asChild className="h-16 lg:h-20 flex-col bg-yellow-600 hover:bg-yellow-700 text-sm">
              <Link href="/admin/kyc/pending">
                <FileCheck className="h-5 w-5 lg:h-6 lg:w-6 mb-2" />
                Review KYC Applications
                {stats.pendingKyc > 0 && (
                  <Badge className="mt-1 bg-white text-yellow-600 text-xs">{stats.pendingKyc} pending</Badge>
                )}
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-16 lg:h-20 flex-col bg-transparent text-sm">
              <Link href="/admin/users">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 mb-2" />
                Manage Users
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-16 lg:h-20 flex-col bg-transparent text-sm">
              <Link href="/admin/transactions">
                <CreditCard className="h-5 w-5 lg:h-6 lg:w-6 mb-2" />
                View Transactions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="mx-2 lg:mx-0">
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="text-lg lg:text-xl">Recent Transactions</CardTitle>
          <CardDescription className="text-sm">Latest system transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0">
          <div className="space-y-3 lg:space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No recent transactions</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-3 lg:p-4 border rounded-lg space-y-2 lg:space-y-0"
                >
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                      <CreditCard className="h-3 w-3 lg:h-4 lg:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm lg:text-base">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs lg:text-sm text-gray-500 truncate">
                        {transaction.account_no} → {transaction.recipient_account_number || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {getStatusBadge(transaction.status)}
                    <Badge variant="outline" className="text-xs">
                      {transaction.transaction_type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
