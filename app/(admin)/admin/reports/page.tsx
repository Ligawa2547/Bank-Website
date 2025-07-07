"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Download, Users, CreditCard, DollarSign, TrendingUp, Calendar, FileText, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  total_users: number
  active_users: number
  suspended_users: number
  pending_users: number
  new_users_today: number
  total_balance: number
  total_transactions: number
  transactions_today: number
  successful_transactions: number
  failed_transactions: number
  pending_transactions: number
  kyc_pending: number
  kyc_approved: number
  kyc_rejected: number
  total_deposits: number
  total_withdrawals: number
  total_transfers: number
}

interface MonthlyData {
  month: string
  users: number
  transactions: number
  volume: number
}

export default function AdminReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState("30")
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // Fetch dashboard stats
      const { data: statsData, error: statsError } = await supabase.rpc("get_admin_dashboard_stats")
      if (statsError) throw statsError
      setStats(statsData)

      // Fetch monthly trends (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: monthlyUsers, error: usersError } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString())

      const { data: monthlyTransactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("created_at, amount")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("status", "completed")

      if (usersError) throw usersError
      if (transactionsError) throw transactionsError

      // Process monthly data
      const monthlyStats: { [key: string]: MonthlyData } = {}

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
        const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

        monthlyStats[monthKey] = {
          month: monthName,
          users: 0,
          transactions: 0,
          volume: 0,
        }
      }

      // Count users by month
      monthlyUsers?.forEach((user) => {
        const monthKey = user.created_at.slice(0, 7)
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].users++
        }
      })

      // Count transactions and volume by month
      monthlyTransactions?.forEach((transaction) => {
        const monthKey = transaction.created_at.slice(0, 7)
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].transactions++
          monthlyStats[monthKey].volume += Number.parseFloat(transaction.amount) || 0
        }
      })

      setMonthlyData(Object.values(monthlyStats))
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (type: string) => {
    setExportLoading(type)

    try {
      let data: any[] = []
      let filename = ""
      let headers: string[] = []

      switch (type) {
        case "users":
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("first_name, last_name, email, account_no, account_balance, status, kyc_status, created_at")
            .order("created_at", { ascending: false })

          if (usersError) throw usersError

          data = usersData || []
          filename = "users_report.csv"
          headers = [
            "First Name",
            "Last Name",
            "Email",
            "Account Number",
            "Balance",
            "Status",
            "KYC Status",
            "Created At",
          ]
          break

        case "transactions":
          const { data: transactionsData, error: transactionsError } = await supabase
            .from("transactions")
            .select("account_no, type, amount, status, description, created_at")
            .order("created_at", { ascending: false })
            .limit(10000) // Limit for performance

          if (transactionsError) throw transactionsError

          data = transactionsData || []
          filename = "transactions_report.csv"
          headers = ["Account Number", "Type", "Amount", "Status", "Description", "Created At"]
          break

        case "financial":
          data = [
            {
              total_balance: stats?.total_balance || 0,
              total_deposits: stats?.total_deposits || 0,
              total_withdrawals: stats?.total_withdrawals || 0,
              total_transfers: stats?.total_transfers || 0,
              successful_transactions: stats?.successful_transactions || 0,
              failed_transactions: stats?.failed_transactions || 0,
              generated_at: new Date().toISOString(),
            },
          ]
          filename = "financial_summary.csv"
          headers = [
            "Total Balance",
            "Total Deposits",
            "Total Withdrawals",
            "Total Transfers",
            "Successful Transactions",
            "Failed Transactions",
            "Generated At",
          ]
          break
      }

      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const key = header.toLowerCase().replace(/\s+/g, "_")
              const value = row[key] || ""
              return `"${value}"`
            })
            .join(","),
        ),
      ].join("\n")

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: `${filename} downloaded successfully`,
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExportLoading(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num || 0)
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-600">Comprehensive system analytics and data exports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_users || 0)}</div>
            <p className="text-xs text-muted-foreground">+{stats?.new_users_today || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_balance || 0)}</div>
            <p className="text-xs text-muted-foreground">System-wide balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_transactions || 0)}</div>
            <p className="text-xs text-muted-foreground">+{stats?.transactions_today || 0} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculatePercentage(stats?.successful_transactions || 0, stats?.total_transactions || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">Transaction success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Statistics</span>
            </CardTitle>
            <CardDescription>User account status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users</span>
              <div className="flex items-center space-x-2">
                <Badge variant="default">{formatNumber(stats?.active_users || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.active_users || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Suspended Users</span>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">{formatNumber(stats?.suspended_users || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.suspended_users || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Users</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{formatNumber(stats?.pending_users || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.pending_users || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>KYC Status</span>
            </CardTitle>
            <CardDescription>Know Your Customer verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Approved</span>
              <div className="flex items-center space-x-2">
                <Badge variant="default">{formatNumber(stats?.kyc_approved || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.kyc_approved || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Review</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{formatNumber(stats?.kyc_pending || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.kyc_pending || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Rejected</span>
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">{formatNumber(stats?.kyc_rejected || 0)}</Badge>
                <span className="text-xs text-gray-500">
                  {calculatePercentage(stats?.kyc_rejected || 0, stats?.total_users || 0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Overview</span>
          </CardTitle>
          <CardDescription>Transaction volumes and financial flows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.total_deposits || 0)}</div>
              <p className="text-sm text-gray-600">Total Deposits</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.total_withdrawals || 0)}</div>
              <p className="text-sm text-gray-600">Total Withdrawals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.total_transfers || 0)}</div>
              <p className="text-sm text-gray-600">Total Transfers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Monthly Trends</span>
          </CardTitle>
          <CardDescription>6-month performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{month.month}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{formatNumber(month.users)}</div>
                    <div className="text-gray-500">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{formatNumber(month.transactions)}</div>
                    <div className="text-gray-500">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{formatCurrency(month.volume)}</div>
                    <div className="text-gray-500">Volume</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Data</span>
          </CardTitle>
          <CardDescription>Download reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => exportData("users")}
              disabled={exportLoading === "users"}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading === "users" ? "Exporting..." : "Export Users"}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("transactions")}
              disabled={exportLoading === "transactions"}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading === "transactions" ? "Exporting..." : "Export Transactions"}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData("financial")}
              disabled={exportLoading === "financial"}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading === "financial" ? "Exporting..." : "Export Financial Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
