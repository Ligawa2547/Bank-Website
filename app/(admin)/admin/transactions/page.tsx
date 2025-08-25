"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  id: string
  user_id: string
  account_no: string
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
  updated_at?: string
}

interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  successfulTransactions: number
  failedTransactions: number
  pendingTransactions: number
}

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [processing, setProcessing] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
    fetchStats()
  }, [statusFilter, typeFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      let query = supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100)

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (typeFilter !== "all") {
        query = query.eq("transaction_type", typeFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from("transactions").select("amount, status, transaction_type")

      if (error) throw error

      const totalTransactions = data?.length || 0
      const totalAmount = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const successfulTransactions = data?.filter((t) => t.status === "completed").length || 0
      const failedTransactions = data?.filter((t) => t.status === "failed").length || 0
      const pendingTransactions = data?.filter((t) => t.status === "pending").length || 0

      setStats({
        totalTransactions,
        totalAmount,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
      })
    } catch (error) {
      console.error("Error fetching transaction stats:", error)
    }
  }

  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    setProcessing(transactionId)

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transactionId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Transaction status updated to ${newStatus}`,
      })

      fetchTransactions()
      fetchStats()
    } catch (error) {
      console.error("Error updating transaction status:", error)
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const exportTransactions = () => {
    const csvContent = [
      ["ID", "Amount", "Type", "Status", "Account", "Reference", "Description", "Date"].join(","),
      ...filteredTransactions.map((t) =>
        [
          t.id || "",
          t.amount || 0,
          t.transaction_type || "",
          t.status || "",
          t.account_no || "",
          t.reference || "",
          `"${(t.narration || "").replace(/"/g, '""')}"`,
          new Date(t.created_at).toLocaleString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      (transaction.account_no && transaction.account_no.toLowerCase().includes(searchLower)) ||
      (transaction.recipient_account_number &&
        transaction.recipient_account_number.toLowerCase().includes(searchLower)) ||
      (transaction.sender_account_number && transaction.sender_account_number.toLowerCase().includes(searchLower)) ||
      (transaction.narration && transaction.narration.toLowerCase().includes(searchLower)) ||
      (transaction.reference && transaction.reference.toLowerCase().includes(searchLower)) ||
      (transaction.id && transaction.id.toString().toLowerCase().includes(searchLower))

    return matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Failed</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
      case "transfer_in":
        return <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
      case "transfer_out":
        return <DollarSign className="h-4 w-4 text-orange-600 flex-shrink-0" />
      case "loan_disbursement":
        return <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
      case "loan_repayment":
        return <TrendingDown className="h-4 w-4 text-indigo-600 flex-shrink-0" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600 flex-shrink-0" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Deposit</Badge>
      case "withdrawal":
        return <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">Withdrawal</Badge>
      case "transfer_in":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Transfer In</Badge>
      case "transfer_out":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Transfer Out</Badge>
      case "loan_disbursement":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">Loan Disbursement</Badge>
      case "loan_repayment":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">Loan Repayment</Badge>
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        )
    }
  }

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "transfer_in":
        return "Transfer In"
      case "transfer_out":
        return "Transfer Out"
      case "loan_disbursement":
        return "Loan Disbursement"
      case "loan_repayment":
        return "Loan Repayment"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor and manage all system transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Transactions</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Amount</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-sm sm:text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Success</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.successfulTransactions}</div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Badge variant="secondary" className="text-xs">
            {filteredTransactions.length} results
          </Badge>
        </div>

        {/* Filters */}
        <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="transfer_in">Transfer In</SelectItem>
                <SelectItem value="transfer_out">Transfer Out</SelectItem>
                <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 sm:gap-4">
              <Button
                onClick={exportTransactions}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>

              <Badge variant="secondary" className="hidden sm:flex items-center px-3">
                {filteredTransactions.length} transactions
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-semibold text-base">{formatCurrency(transaction.amount)}</p>
                        <p className="text-xs text-gray-500">{getTypeDisplayName(transaction.transaction_type)}</p>
                      </div>
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 line-clamp-2">{transaction.narration}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Account: {transaction.account_no}</span>
                      <span>•</span>
                      <span>Ref: {transaction.reference}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(transaction.created_at).toLocaleString()}</p>
                  </div>

                  {transaction.status === "pending" && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => updateTransactionStatus(transaction.id, "completed")}
                        disabled={processing === transaction.id}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {processing === transaction.id ? "Processing..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTransactionStatus(transaction.id, "failed")}
                        disabled={processing === transaction.id}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {processing === transaction.id ? "Processing..." : "Reject"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTypeIcon(transaction.transaction_type)}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
                        {getTypeBadge(transaction.transaction_type)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{transaction.narration}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Account: {transaction.account_no}</span>
                        <span>Ref: {transaction.reference}</span>
                        {transaction.recipient_account_number && (
                          <span>To: {transaction.recipient_account_number}</span>
                        )}
                        {transaction.sender_account_number && <span>From: {transaction.sender_account_number}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">{getStatusBadge(transaction.status)}</div>
                      <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleString()}</p>
                      {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                        <p className="text-xs text-gray-400">
                          Updated: {new Date(transaction.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {transaction.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateTransactionStatus(transaction.id, "completed")}
                          disabled={processing === transaction.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {processing === transaction.id ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTransactionStatus(transaction.id, "failed")}
                          disabled={processing === transaction.id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {processing === transaction.id ? "Processing..." : "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-500">No transactions match your current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
