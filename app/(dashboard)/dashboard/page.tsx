"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CreditCard, DollarSign, LineChart, Wallet, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Transaction } from "@/types/user"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile?.account_number) return

    const fetchDashboardData = async () => {
      setIsLoading(true)

      try {
        // Use Promise.all to fetch data in parallel
        const [transactionsResponse, savingsResponse] = await Promise.all([
          // Limit fields to only what's needed
          supabase
            .from("transactions")
            .select(
              "id, amount, created_at, transaction_type, sender_name, sender_account_number, recipient_name, recipient_account_number, reference",
            )
            .or(`account_no.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number}`)
            .order("created_at", { ascending: false })
            .limit(5),

          supabase
            .from("savings_accounts")
            .select("id, name, current_amount, target_amount")
            .eq("account_no", profile.account_number),
        ])

        if (!transactionsResponse.error && transactionsResponse.data) {
          setTransactions(transactionsResponse.data)
        } else {
          console.error("Error fetching transactions:", transactionsResponse.error)
        }

        if (!savingsResponse.error && savingsResponse.data) {
          setSavingsAccounts(savingsResponse.data)
        } else {
          console.error("Error fetching savings accounts:", savingsResponse.error)
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, profile, supabase])

  // Add this memoized formatter function to avoid recreating it on every render
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }, [])

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance)
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Mobile-optimized header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {profile?.first_name}!</p>
        </div>

        {/* Mobile account info card */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0A3D62] to-[#0F5585] p-3 sm:p-4 rounded-lg text-white">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <div>
              <p className="text-xs sm:text-sm font-medium">Account #{profile?.account_number}</p>
              <p className="text-xs opacity-90">USD Currency</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold">
                {showBalance ? formatCurrency(profile?.balance || 0) : "••••••"}
              </span>
              <button
                onClick={toggleBalanceVisibility}
                className="p-1 hover:bg-white/20 rounded"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs opacity-90">Available Balance</p>
          </div>
        </div>
      </div>

      {/* Account Details Card - Mobile Optimized */}
      {profile && (
        <div className="block sm:hidden">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] p-4">
              <div className="text-white">
                <h3 className="text-base font-medium">Account Details</h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Name:</span>
                    <span className="text-sm font-medium">
                      {profile.first_name} {profile.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Account:</span>
                    <span className="text-sm font-mono">{profile.account_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Balance:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">
                        {showBalance ? formatCurrency(profile.balance || 0) : "••••••"}
                      </span>
                      <button onClick={toggleBalanceVisibility} className="p-1 hover:bg-white/20 rounded">
                        {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Desktop Account Details Card */}
      {profile && (
        <div className="hidden sm:block">
          <AccountDetailsCard
            accountNumber={profile.account_number}
            accountName={`${profile.first_name} ${profile.last_name}`}
            balance={profile.balance}
          />
        </div>
      )}

      {/* Account Summary - Mobile Optimized Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Current Balance</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {showBalance ? formatCurrency(profile?.balance || 0) : "••••••"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available now</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Savings</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatCurrency(savingsAccounts.reduce((total, account) => total + account.current_amount, 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{savingsAccounts.length} goal(s)</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Monthly Spending</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatCurrency(
                transactions
                  .filter(
                    (t) =>
                      t.transaction_type === "withdrawal" ||
                      t.transaction_type === "transfer_out" ||
                      t.transaction_type === "payment",
                  )
                  .reduce((total, t) => total + t.amount, 0),
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Account Growth</CardTitle>
            <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-gray-500 mt-1">From last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Button asChild className="bg-[#0A3D62] hover:bg-[#0F5585] h-12 sm:h-auto">
          <Link href="/dashboard/transfers" className="flex flex-col items-center space-y-1 p-3">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs sm:text-sm">Transfer</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="border-[#0A3D62] text-[#0A3D62] h-12 sm:h-auto">
          <Link href="/dashboard/loans" className="flex flex-col items-center space-y-1 p-3">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs sm:text-sm">Loans</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="border-[#0A3D62] text-[#0A3D62] h-12 sm:h-auto">
          <Link href="/dashboard/savings" className="flex flex-col items-center space-y-1 p-3">
            <Wallet className="h-5 w-5" />
            <span className="text-xs sm:text-sm">Savings</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="border-[#0A3D62] text-[#0A3D62] h-12 sm:h-auto">
          <Link href="/dashboard/transactions" className="flex flex-col items-center space-y-1 p-3">
            <LineChart className="h-5 w-5" />
            <span className="text-xs sm:text-sm">History</span>
          </Link>
        </Button>
      </div>

      {/* Recent Transactions - Mobile Optimized */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-sm">Your recent account activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/transactions" className="flex items-center justify-center">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${
                        transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                            ? "text-green-600 rotate-180"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {transaction.transaction_type === "deposit"
                          ? "Deposit"
                          : transaction.transaction_type === "withdrawal"
                            ? "Withdrawal"
                            : transaction.transaction_type === "transfer_in"
                              ? `From ${transaction.sender_name || transaction.sender_account_number || "Unknown"}`
                              : `To ${transaction.recipient_name || transaction.recipient_account_number || "Unknown"}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()} • {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                      ? "+"
                      : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">No recent transactions</p>
              <Button asChild className="mt-4 bg-[#0A3D62]" size="sm">
                <Link href="/dashboard/transfers">Make Your First Transfer</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Goals - Mobile Optimized */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg sm:text-xl">Savings Goals</CardTitle>
            <CardDescription className="text-sm">Track your savings progress</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/savings" className="flex items-center justify-center">
              Manage Savings <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : savingsAccounts.length > 0 ? (
            <div className="space-y-4">
              {savingsAccounts.map((account) => (
                <div key={account.id} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm sm:text-base">{account.name}</p>
                    <p className="text-sm font-medium">{formatCurrency(account.current_amount)}</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-[#0A3D62]"
                      style={{
                        width: `${Math.min(100, (account.current_amount / account.target_amount) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <p>Target: {formatCurrency(account.target_amount)}</p>
                    <p>{Math.round((account.current_amount / account.target_amount) * 100)}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">No savings goals yet</p>
              <Button asChild className="mt-4 bg-[#0A3D62]" size="sm">
                <Link href="/dashboard/savings?action=create">Create Your First Goal</Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 sm:p-6 pt-0">
          <Button className="w-full bg-[#0A3D62] hover:bg-[#0F5585]" asChild>
            <Link href="/dashboard/savings?action=create">Create New Savings Goal</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
