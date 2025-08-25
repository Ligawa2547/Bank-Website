"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Search, Download, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "transfer_in":
        return <DollarSign className="h-4 w-4 text-blue-600" />
      case "transfer_out":
        return <DollarSign className="h-4 w-4 text-orange-600" />
      case "loan_disbursement":
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case "loan_repayment":
        return <TrendingDown className="h-4 w-4 text-indigo-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge className="bg-green-50 text-green-700 border-green-200">Deposit</Badge>
      case "withdrawal":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Withdrawal</Badge>
      case "transfer_in":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Transfer In</Badge>
      case "transfer_out":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Transfer Out</Badge>
      case "loan_disbursement":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Loan Disbursement</Badge>
      case "loan_repayment":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Loan Repayment</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
        <p className="text-gray-600">Monitor and manage all system transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successfulTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by account, reference, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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
        <Button onClick={exportTransactions} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Badge variant="secondary" className="flex items-center">
          {filteredTransactions.length} transactions
        </Badge>
      </div>

      {/* Transactions List */}
      <div className="grid gap-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
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
