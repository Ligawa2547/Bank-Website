"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useSupabase } from "@/providers/supabase-provider"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  user_id: string
  transaction_type: "deposit" | "withdrawal" | "transfer"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  payment_method: string
  narration: string
  reference: string
  created_at: string
  account_no: string
  user_name: string
}

interface TransactionStats {
  total_transactions: number
  total_amount: number
  pending_transactions: number
  completed_transactions: number
  failed_transactions: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    total_transactions: 0,
    total_amount: 0,
    pending_transactions: 0,
    completed_transactions: 0,
    failed_transactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { supabase } = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch transactions with user details
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(
          `
          *,
          users!inner(
            account_no,
            first_name,
            last_name
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        })
        return
      }

      // Transform the data to include user info
      const transformedTransactions =
        transactionsData?.map((transaction: any) => ({
          ...transaction,
          account_no: transaction.users.account_no,
          user_name: `${transaction.users.first_name} ${transaction.users.last_name}`,
        })) || []

      setTransactions(transformedTransactions)

      // Calculate stats
      const totalTransactions = transformedTransactions.length
      const totalAmount = transformedTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
      const pendingTransactions = transformedTransactions.filter((t: Transaction) => t.status === "pending").length
      const completedTransactions = transformedTransactions.filter((t: Transaction) => t.status === "completed").length
      const failedTransactions = transformedTransactions.filter((t: Transaction) => t.status === "failed").length

      setStats({
        total_transactions: totalTransactions,
        total_amount: totalAmount,
        pending_transactions: pendingTransactions,
        completed_transactions: completedTransactions,
        failed_transactions: failedTransactions,
      })
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.account_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.payment_method?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.transaction_type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Account Number",
      "User Name",
      "Type",
      "Amount",
      "Status",
      "Payment Method",
      "Reference",
      "Description",
    ]

    const csvData = filteredTransactions.map((transaction) => [
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.account_no,
      transaction.user_name,
      transaction.transaction_type,
      transaction.amount,
      transaction.status,
      transaction.payment_method,
      transaction.reference,
      transaction.narration,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "Transactions exported to CSV file",
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: "text-green-700 bg-green-100",
      pending: "text-yellow-700 bg-yellow-100",
      failed: "text-red-700 bg-red-100",
      cancelled: "text-gray-700 bg-gray-100",
    }

    return (
      <Badge className={`${colors[status] || "text-gray-700 bg-gray-100"} text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "transfer":
        return <DollarSign className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Monitor and manage all user transactions</p>
        </div>
        <Button onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Export</span>
          <span className="hidden sm:inline">Export CSV</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.total_transactions}</p>
              </div>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Volume</p>
                <p className="text-sm sm:text-lg font-bold">{formatCurrency(stats.total_amount)}</p>
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.pending_transactions}</p>
              </div>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.completed_transactions}</p>
              </div>
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-lg sm:text-2xl font-bold">{stats.failed_transactions}</p>
              </div>
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Filter Transactions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showMobileFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 ${showMobileFilters ? "block" : "hidden"} sm:block`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by account number, name, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            {filteredTransactions.length === 0 ? "No transactions found" : "Latest transaction activity"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <Alert>
              <AlertDescription>No transactions found matching your current filters.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Mobile Layout */}
              <div className="sm:hidden space-y-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-4">
                    <div className="space-y-3">
                      {/* Account Info - Highlighted */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Account:</span>
                        </div>
                        <div className="font-bold text-lg text-gray-900">{transaction.account_no}</div>
                        <div className="text-sm text-gray-600">{transaction.user_name}</div>
                      </div>

                      {/* Transaction Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.transaction_type)}
                          <span className="font-medium capitalize">{transaction.transaction_type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(transaction.amount)}</div>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <strong>Method:</strong> {transaction.payment_method}
                        </div>
                        <div>
                          <strong>Reference:</strong> {transaction.reference}
                        </div>
                        <div>
                          <strong>Date:</strong> {formatDate(transaction.created_at)}
                        </div>
                        <div>
                          <strong>Description:</strong> {transaction.narration}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Account</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Amount</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Method</th>
                      <th className="text-left p-2 font-medium">Reference</th>
                      <th className="text-left p-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-sm">{formatDate(transaction.created_at)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <div>
                              <div className="font-bold text-gray-900">{transaction.account_no}</div>
                              <div className="text-xs text-gray-600">{transaction.user_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.transaction_type)}
                            <span className="capitalize text-sm">{transaction.transaction_type}</span>
                          </div>
                        </td>
                        <td className="p-2 font-medium">{formatCurrency(transaction.amount)}</td>
                        <td className="p-2">{getStatusBadge(transaction.status)}</td>
                        <td className="p-2 text-sm">{transaction.payment_method}</td>
                        <td className="p-2 text-sm font-mono">{transaction.reference}</td>
                        <td className="p-2 text-sm max-w-xs truncate" title={transaction.narration}>
                          {transaction.narration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
