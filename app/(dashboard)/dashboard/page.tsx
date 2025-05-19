"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CreditCard, DollarSign, LineChart, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Transaction } from "@/types/user"
import { AccountDetailsCard } from "@/components/dashboard/account-details-card"

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile?.account_number) return

    const fetchDashboardData = async () => {
      setIsLoading(true)

      try {
        // Fetch recent transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .eq("account_no", profile.account_number) // Using account_no column
          .order("created_at", { ascending: false })
          .limit(5)

        if (!transactionsError && transactionsData) {
          setTransactions(transactionsData)
        } else {
          console.error("Error fetching transactions:", transactionsError)
        }

        // Fetch savings accounts
        const { data: savingsData, error: savingsError } = await supabase
          .from("savings_accounts")
          .select("*")
          .eq("account_no", profile.account_number) // Using account_no column

        if (!savingsError && savingsData) {
          setSavingsAccounts(savingsData)
        } else {
          console.error("Error fetching savings accounts:", savingsError)
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, profile, supabase])

  const formatCurrency = (amount: number) => {
dashboarddashboard    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md">
          <DollarSign className="h-5 w-5 text-[#0A3D62]" />
          <div>
            <p className="text-sm font-medium">Account #{profile?.account_number}</p>
            <p className="text-xs text-gray-500">Currency: USD</p>
          </div>
        </div>
      </div>

      {/* Account Details Card */}
      {profile && (
        <AccountDetailsCard
          accountNumber={users.account_number}
          accountName={`${users.first_name} ${users.last_name}`}
          balance={users.balance}
        />
      )}

      {/* Account Summary */}
      <div className="gr:id gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile?.balance || 0)}</div>
            <p className="text-xs text-gray-500">Available for withdrawal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <Wallet className="h-4 w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(savingsAccounts.reduce((total, account) => total + account.current_amount, 0))}
            </div>
            <p className="text-xs text-gray-500">{savingsAccounts.length} savings goal(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <p className="text-xs text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Growth</CardTitle>
            <LineChart className="h-4 w-4 text-[#0A3D62]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-gray-500">From last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your recent account activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/transactions">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-5 w-5 ${
                          transaction.transaction_type === "deposit" || transaction.transaction_type === "transfer_in"
                            ? "text-green-600 rotate-180"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
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
            <div className="py-8 text-center text-gray-500">No recent transactions</div>
          )}
        </CardContent>
      </Card>

      {/* Savings Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>Track your savings progress</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/savings">
              Manage Savings <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : savingsAccounts.length > 0 ? (
            <div className="space-y-4">
              {savingsAccounts.map((account) => (
                <div key={account.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm font-medium">{formatCurrency(account.current_amount)}</p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
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
            <div className="py-8 text-center text-gray-500">No savings goals yet</div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-[#0A3D62]" asChild>
            <Link href="/dashboard/savings?action=create">Create New Savings Goal</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
