"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, CreditCard, PiggyBank, Bell, Activity, Users } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalBalance: number
  totalTransactions: number
  totalSavings: number
  unreadNotifications: number
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    description: string
    created_at: string
  }>
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [showBalance, setShowBalance] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalTransactions: 0,
    totalSavings: 0,
    unreadNotifications: 0,
    recentTransactions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile) return

    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch recent transactions
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},account_no.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })
          .limit(5)

        // Fetch savings accounts
        const { data: savings } = await supabase
          .from("savings_accounts")
          .select("current_amount")
          .eq("account_no", profile.account_number)

        // Fetch unread notifications
        const { data: notifications } = await supabase
          .from("notifications")
          .select("id")
          .eq("account_no", profile.account_number)
          .eq("is_read", false)

        const totalSavings = savings?.reduce((sum, account) => sum + account.current_amount, 0) || 0
        const totalTransactions = transactions?.length || 0
        const unreadNotifications = notifications?.length || 0

        setStats({
          totalBalance: profile.balance || 0,
          totalTransactions,
          totalSavings,
          unreadNotifications,
          recentTransactions: transactions || [],
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, profile, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatAccountNumber = (accountNumber: string) => {
    return accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A3D62] border-t-transparent"></div>
          <span className="text-lg text-gray-600">Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {getGreeting()}, {profile?.first_name}! 👋
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">Welcome back to your I&E Bank dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm mb-1">Account Number</p>
            <p className="font-mono text-lg font-semibold">
              {profile?.account_number ? formatAccountNumber(profile.account_number) : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Account Balance Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Account Balance</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
              className="h-8 w-8 text-gray-500 hover:text-gray-700"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl sm:text-4xl font-bold text-[#0A3D62] mb-2">
            {showBalance ? formatCurrency(stats.totalBalance) : "••••••"}
          </div>
          <p className="text-gray-600 text-sm">Available Balance</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unreadNotifications}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">KYC Status</p>
                <Badge
                  variant={profile?.kyc_status === "approved" ? "default" : "secondary"}
                  className={
                    profile?.kyc_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : profile?.kyc_status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {profile?.kyc_status === "approved"
                    ? "Verified"
                    : profile?.kyc_status === "pending"
                      ? "Pending"
                      : "Not Verified"}
                </Badge>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
          <CardDescription>Frequently used banking services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col bg-[#0A3D62] hover:bg-[#0F5585]">
              <Link href="/dashboard/transfers">
                <ArrowUpRight className="h-6 w-6 mb-2" />
                <span className="text-sm">Send Money</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50 bg-transparent">
              <Link href="/dashboard/savings">
                <PiggyBank className="h-6 w-6 mb-2" />
                <span className="text-sm">Save Money</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50 bg-transparent">
              <Link href="/dashboard/loans">
                <CreditCard className="h-6 w-6 mb-2" />
                <span className="text-sm">Get Loan</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col border-2 hover:bg-gray-50 bg-transparent">
              <Link href="/dashboard/transactions">
                <Activity className="h-6 w-6 mb-2" />
                <span className="text-sm">View History</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {transaction.type === "deposit" || transaction.type === "transfer_in" ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "deposit" || transaction.type === "transfer_in"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "deposit" || transaction.type === "transfer_in" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent transactions</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
