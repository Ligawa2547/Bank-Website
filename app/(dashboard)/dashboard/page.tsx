"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { useSupabase } from "@/providers/supabase-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  balance_after: number
  narration: string
  status: string
  created_at: string
  payment_method: string
}

interface DashboardStats {
  totalBalance: number
  totalDeposits: number
  totalWithdrawals: number
  pendingTransactions: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  const { supabase, user, loading: authLoading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else {
        loadDashboardData()
      }
    }
  }, [authLoading, user, router])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setIsLoading(true)

      // Get user profile for balance
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("account_balance, first_name, last_name, account_no")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
        return
      }

      setUserProfile(profile)

      // Get recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

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
          .reduce((sum, t) => sum + t.amount, 0) || 0

      const pendingTransactions = transactions?.filter((t) => t.status === "pending").length || 0

      setStats({
        totalBalance: profile?.account_balance || 0,
        totalDeposits,
        totalWithdrawals,
        pendingTransactions,
      })

      setRecentTransactions(transactions || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-yellow-500" />
    if (status === "failed") return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === "completed") {
      return type === "deposit" ? (
        <ArrowDownRight className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowUpRight className="h-4 w-4 text-red-500" />
      )
    }
    return <CheckCircle className="h-4 w-4 text-gray-500" />
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      cancelled: "outline",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1">
            {userProfile?.first_name || user?.user_metadata?.first_name || "User"}, here's your financial overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
            <Link href="/dashboard/transfers">
              <Plus className="mr-2 h-4 w-4" />
              Add Money
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-lg font-semibold border-2 bg-transparent">
            <Link href="/dashboard/transfers">
              <Send className="mr-2 h-4 w-4" />
              Transfer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance - Primary */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold opacity-90">Total Balance</CardTitle>
            <DollarSign className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalBalance)}</div>
            <p className="text-xs opacity-80 mt-1">Available balance</p>
          </CardContent>
        </Card>

        {/* Total Deposits - Secondary */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-secondary/80 to-secondary text-secondary-foreground shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold opacity-90">Total Deposits</CardTitle>
            <ArrowDownRight className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalDeposits)}</div>
            <p className="text-xs opacity-80 mt-1">All time deposits</p>
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-md hover:shadow-lg hover:border-accent/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Total Withdrawals</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time withdrawals</p>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="relative overflow-hidden border border-border/50 bg-card shadow-md hover:shadow-lg hover:border-accent/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Pending</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Details and Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <AccountDetailsCard />
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest account activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by making your first deposit.</p>
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/dashboard/transfers">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Money
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.transaction_type, transaction.status)}
                        <div>
                          <p className="text-sm font-medium">{transaction.narration}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)} • {transaction.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              transaction.transaction_type === "deposit" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.transaction_type === "deposit" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {formatCurrency(transaction.balance_after)}
                          </p>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/dashboard/transactions">View All Transactions</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common banking tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/transfers">
                <Plus className="h-6 w-6 mb-2" />
                Add Money
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/transfers">
                <Send className="h-6 w-6 mb-2" />
                Send Money
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/statements">
                <CreditCard className="h-6 w-6 mb-2" />
                Statements
              </Link>
            </Button>

            <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
              <Link href="/dashboard/support">
                <Users className="h-6 w-6 mb-2" />
                Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats.pendingTransactions > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.pendingTransactions} pending transaction{stats.pendingTransactions > 1 ? "s" : ""}. They
            will be processed shortly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
