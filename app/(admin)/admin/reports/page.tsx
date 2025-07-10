"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BarChart3, Download, Users, CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportData {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalVolume: number
  averageTransactionAmount: number
  kycPending: number
  kycApproved: number
  kycRejected: number
}

interface MonthlyData {
  month: string
  users: number
  transactions: number
  volume: number
}

export default function AdminReports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalVolume: 0,
    averageTransactionAmount: 0,
    kycPending: 0,
    kycApproved: 0,
    kycRejected: 0,
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState("30")
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReportData()
  }, [reportPeriod])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      console.log("Fetching report data...")

      // Fetch users data
      const { data: users, error: usersError } = await supabase.from("users").select("*")

      if (usersError) throw usersError

      // Fetch transactions data
      const { data: transactions, error: transactionsError } = await supabase.from("transactions").select("*")

      if (transactionsError) throw transactionsError

      console.log("Users data:", users?.length)
      console.log("Transactions data:", transactions?.length)

      // Calculate report metrics
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const daysAgo = new Date(now.getTime() - Number.parseInt(reportPeriod) * 24 * 60 * 60 * 1000)

      const newUsersThisMonth = users?.filter((user) => new Date(user.created_at) >= startOfMonth).length || 0

      const recentTransactions =
        transactions?.filter((transaction) => new Date(transaction.created_at) >= daysAgo) || []

      const successfulTransactions = transactions?.filter((t) => t.status === "completed").length || 0
      const failedTransactions = transactions?.filter((t) => t.status === "failed").length || 0

      const totalVolume =
        transactions?.reduce((sum, t) => {
          if (t.status === "completed") {
            return sum + (Number.parseFloat(t.amount) || 0)
          }
          return sum
        }, 0) || 0

      const averageTransactionAmount = successfulTransactions > 0 ? totalVolume / successfulTransactions : 0

      const reportMetrics: ReportData = {
        totalUsers: users?.length || 0,
        activeUsers: users?.filter((u) => u.status === "active").length || 0,
        newUsersThisMonth,
        totalTransactions: transactions?.length || 0,
        successfulTransactions,
        failedTransactions,
        totalVolume,
        averageTransactionAmount,
        kycPending: users?.filter((u) => u.kyc_status === "pending").length || 0,
        kycApproved: users?.filter((u) => u.kyc_status === "approved").length || 0,
        kycRejected: users?.filter((u) => u.kyc_status === "rejected").length || 0,
      }

      // Calculate monthly trends (last 6 months)
      const monthlyTrends: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const monthUsers =
          users?.filter((user) => {
            const userDate = new Date(user.created_at)
            return userDate >= monthStart && userDate <= monthEnd
          }).length || 0

        const monthTransactions =
          transactions?.filter((transaction) => {
            const transactionDate = new Date(transaction.created_at)
            return transactionDate >= monthStart && transactionDate <= monthEnd && transaction.status === "completed"
          }) || []

        const monthVolume = monthTransactions.reduce((sum, t) => sum + (Number.parseFloat(t.amount) || 0), 0)

        monthlyTrends.push({
          month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          users: monthUsers,
          transactions: monthTransactions.length,
          volume: monthVolume,
        })
      }

      setReportData(reportMetrics)
      setMonthlyData(monthlyTrends)
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

  const exportToCSV = async (type: "users" | "transactions" | "financial") => {
    setExporting(true)
    try {
      let data: any[] = []
      let filename = ""
      let headers: string[] = []

      if (type === "users") {
        const { data: users, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        data = users || []
        filename = "users_report.csv"
        headers = [
          "ID",
          "Email",
          "First Name",
          "Last Name",
          "Account No",
          "Balance",
          "Status",
          "KYC Status",
          "Created At",
        ]
      } else if (type === "transactions") {
        const { data: transactions, error } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        data = transactions || []
        filename = "transactions_report.csv"
        headers = ["ID", "Account No", "Type", "Amount", "Status", "Reference", "Narration", "Created At"]
      } else if (type === "financial") {
        data = monthlyData
        filename = "financial_report.csv"
        headers = ["Month", "New Users", "Transactions", "Volume"]
      }

      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...data.map((row) => {
          if (type === "users") {
            return [
              row.id,
              row.email,
              row.first_name,
              row.last_name,
              row.account_no,
              row.account_balance,
              row.status,
              row.kyc_status,
              row.created_at,
            ].join(",")
          } else if (type === "transactions") {
            return [
              row.id,
              row.account_no,
              row.transaction_type,
              row.amount,
              row.status,
              row.reference,
              row.narration,
              row.created_at,
            ].join(",")
          } else {
            return [row.month, row.users, row.transactions, row.volume].join(",")
          }
        }),
      ].join("\n")

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: `${type} report exported successfully`,
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">Generating reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
          <p className="text-gray-600">Comprehensive system analytics and reports</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-40">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{reportData.newUsersThisMonth} new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((reportData.successfulTransactions / reportData.totalTransactions) * 100 || 0).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalVolume)}</div>
            <p className="text-xs text-muted-foreground">Avg: {formatCurrency(reportData.averageTransactionAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((reportData.activeUsers / reportData.totalUsers) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </CardTitle>
          <CardDescription>Download detailed reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={() => exportToCSV("users")}
              disabled={exporting}
              variant="outline"
              className="h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              Export Users
              <span className="text-xs text-gray-500">{reportData.totalUsers} records</span>
            </Button>

            <Button
              onClick={() => exportToCSV("transactions")}
              disabled={exporting}
              variant="outline"
              className="h-20 flex-col"
            >
              <CreditCard className="h-6 w-6 mb-2" />
              Export Transactions
              <span className="text-xs text-gray-500">{reportData.totalTransactions} records</span>
            </Button>

            <Button
              onClick={() => exportToCSV("financial")}
              disabled={exporting}
              variant="outline"
              className="h-20 flex-col"
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              Export Financial Summary
              <span className="text-xs text-gray-500">6 months data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>User Analytics</CardTitle>
            <CardDescription>User registration and verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Users</span>
              <Badge variant="secondary">{reportData.totalUsers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Users</span>
              <Badge variant="default">{reportData.activeUsers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>New This Month</span>
              <Badge variant="outline">{reportData.newUsersThisMonth}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>KYC Pending</span>
              <Badge variant="secondary">{reportData.kycPending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>KYC Approved</span>
              <Badge className="bg-green-100 text-green-800">{reportData.kycApproved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>KYC Rejected</span>
              <Badge className="bg-red-100 text-red-800">{reportData.kycRejected}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Analytics</CardTitle>
            <CardDescription>Transaction volume and success rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Transactions</span>
              <Badge variant="secondary">{reportData.totalTransactions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Successful</span>
              <Badge className="bg-green-100 text-green-800">{reportData.successfulTransactions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Failed</span>
              <Badge className="bg-red-100 text-red-800">{reportData.failedTransactions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Volume</span>
              <Badge variant="outline">{formatCurrency(reportData.totalVolume)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Average Amount</span>
              <Badge variant="outline">{formatCurrency(reportData.averageTransactionAmount)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Success Rate</span>
              <Badge className="bg-blue-100 text-blue-800">
                {((reportData.successfulTransactions / reportData.totalTransactions) * 100 || 0).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
          <CardDescription>6-month performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-medium">{month.month}</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{month.users}</div>
                    <div className="text-gray-500">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{month.transactions}</div>
                    <div className="text-gray-500">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{formatCurrency(month.volume)}</div>
                    <div className="text-gray-500">Volume</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
