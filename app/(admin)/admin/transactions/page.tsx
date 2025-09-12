"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@supabase/supabase-js"
import {
  Search,
  Download,
  Send,
  TrendingUp,
  Users,
  CreditCard,
  Check,
  X,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Transaction {
  id: string
  user_id: string
  account_no: string
  transaction_type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "loan_disbursement" | "loan_repayment"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  reference: string
  narration: string
  payment_method?: string
  recipient_account_number?: string
  recipient_name?: string
  sender_account_number?: string
  sender_name?: string
  created_at: string
  updated_at?: string
  metadata?: any
  users?: {
    id: string
    email: string
    first_name: string
    last_name: string
    full_name: string
    account_number: string
    balance: number
  }
}

interface TransactionStats {
  totalTransactions: number
  totalVolume: number
  pendingTransactions: number
  pendingVolume: number
  paypalTransactions: number
  paypalVolume: number
  successRate: number
  avgTransactionSize: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalVolume: 0,
    pendingTransactions: 0,
    pendingVolume: 0,
    paypalTransactions: 0,
    paypalVolume: 0,
    successRate: 0,
    avgTransactionSize: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [processingTransaction, setProcessingTransaction] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter, paymentMethodFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch transactions with user data
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          users!transactions_account_no_fkey (
            id,
            email,
            first_name,
            last_name,
            full_name,
            account_number,
            balance
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        })
        return
      }

      const processedTransactions = (transactionsData || []).map((transaction) => ({
        ...transaction,
        users: transaction.users || {
          id: "",
          email: "N/A",
          first_name: "Unknown",
          last_name: "User",
          full_name: "Unknown User",
          account_number: transaction.account_no || "N/A",
          balance: 0,
        },
      }))

      setTransactions(processedTransactions)
      calculateStats(processedTransactions)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (transactionsData: Transaction[]) => {
    const totalTransactions = transactionsData.length
    const totalVolume = transactionsData.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.amount, 0)

    const pendingTransactions = transactionsData.filter((t) => t.status === "pending").length
    const pendingVolume = transactionsData.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.amount, 0)

    const paypalTransactions = transactionsData.filter((t) => t.payment_method?.toLowerCase().includes("paypal")).length

    const paypalVolume = transactionsData
      .filter((t) => t.payment_method?.toLowerCase().includes("paypal") && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0)

    const completedTransactions = transactionsData.filter((t) => t.status === "completed").length
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
    const avgTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0

    setStats({
      totalTransactions,
      totalVolume,
      pendingTransactions,
      pendingVolume,
      paypalTransactions,
      paypalVolume,
      successRate,
      avgTransactionSize,
    })
  }

  const filterTransactions = () => {
    let filtered = transactions

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (transaction) =>
          transaction.users?.full_name?.toLowerCase().includes(search) ||
          transaction.users?.first_name?.toLowerCase().includes(search) ||
          transaction.users?.last_name?.toLowerCase().includes(search) ||
          transaction.users?.email?.toLowerCase().includes(search) ||
          transaction.users?.account_number?.toLowerCase().includes(search) ||
          transaction.account_no?.toLowerCase().includes(search) ||
          transaction.reference?.toLowerCase().includes(search) ||
          transaction.narration?.toLowerCase().includes(search) ||
          transaction.id.toLowerCase().includes(search),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.transaction_type === typeFilter)
    }

    if (paymentMethodFilter !== "all") {
      if (paymentMethodFilter === "paypal") {
        filtered = filtered.filter((transaction) => transaction.payment_method?.toLowerCase().includes("paypal"))
      } else {
        filtered = filtered.filter((transaction) => transaction.payment_method === paymentMethodFilter)
      }
    }

    setFilteredTransactions(filtered)
  }

  const approveTransaction = async (transaction: Transaction) => {
    try {
      setProcessingTransaction(transaction.id)

      // Update transaction status to completed
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        throw updateError
      }

      // Update user balance based on transaction type
      if (transaction.users?.id) {
        let balanceChange = 0

        switch (transaction.transaction_type) {
          case "deposit":
          case "transfer_in":
          case "loan_disbursement":
            balanceChange = transaction.amount
            break
          case "withdrawal":
          case "transfer_out":
          case "loan_repayment":
            balanceChange = -transaction.amount
            break
        }

        if (balanceChange !== 0) {
          const { error: balanceError } = await supabase.rpc("update_user_balance", {
            user_account_no: transaction.account_no,
            amount_change: balanceChange,
          })

          if (balanceError) {
            console.error("Error updating balance:", balanceError)
            // Don't throw here, transaction is already approved
          }
        }
      }

      // Send notification to user
      await sendNotificationToUser(
        transaction.user_id,
        "Transaction Approved",
        `Your ${transaction.transaction_type} of $${transaction.amount.toFixed(2)} has been approved and processed. Reference: ${transaction.reference}`,
        "success",
      )

      toast({
        title: "Transaction Approved",
        description: `Transaction ${transaction.reference} has been approved successfully`,
      })

      // Refresh transactions
      await fetchTransactions()
    } catch (error) {
      console.error("Error approving transaction:", error)
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      })
    } finally {
      setProcessingTransaction(null)
    }
  }

  const declineTransaction = async (transaction: Transaction, reason: string) => {
    try {
      setProcessingTransaction(transaction.id)

      // Update transaction status to failed
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            decline_reason: reason,
            declined_by: "admin",
            declined_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)

      if (updateError) {
        throw updateError
      }

      // Send notification to user
      await sendNotificationToUser(
        transaction.user_id,
        "Transaction Declined",
        `Your ${transaction.transaction_type} of $${transaction.amount.toFixed(2)} has been declined. Reason: ${reason}. Reference: ${transaction.reference}`,
        "error",
      )

      toast({
        title: "Transaction Declined",
        description: `Transaction ${transaction.reference} has been declined`,
      })

      // Refresh transactions
      await fetchTransactions()
      setDeclineReason("")
    } catch (error) {
      console.error("Error declining transaction:", error)
      toast({
        title: "Error",
        description: "Failed to decline transaction",
        variant: "destructive",
      })
    } finally {
      setProcessingTransaction(null)
    }
  }

  const sendNotificationToUser = async (
    userId: string,
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title,
          message,
          type,
          sendEmail: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  const sendCustomNotification = async () => {
    if (!selectedTransaction || !notificationTitle || !notificationMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      await sendNotificationToUser(selectedTransaction.user_id, notificationTitle, notificationMessage, "info")

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      setNotificationTitle("")
      setNotificationMessage("")
      setSelectedTransaction(null)
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Transaction ID",
      "User Name",
      "Email",
      "Account Number",
      "Type",
      "Amount",
      "Description",
      "Reference",
      "Status",
      "Payment Method",
      "Date",
    ]

    const csvData = filteredTransactions.map((transaction) => [
      transaction.id,
      transaction.users?.full_name || "N/A",
      transaction.users?.email || "N/A",
      transaction.users?.account_number || transaction.account_no || "N/A",
      transaction.transaction_type,
      transaction.amount,
      transaction.narration,
      transaction.reference,
      transaction.status,
      transaction.payment_method || "N/A",
      new Date(transaction.created_at).toLocaleString(),
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
      title: "Success",
      description: "Transactions exported successfully",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", icon: Check },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      failed: { color: "bg-red-100 text-red-800", icon: X },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: X },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeColors = {
      deposit: "bg-blue-100 text-blue-800",
      withdrawal: "bg-orange-100 text-orange-800",
      transfer_in: "bg-green-100 text-green-800",
      transfer_out: "bg-red-100 text-red-800",
      loan_disbursement: "bg-purple-100 text-purple-800",
      loan_repayment: "bg-indigo-100 text-indigo-800",
    }

    const typeLabels = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      transfer_in: "Money In",
      transfer_out: "Money Out",
      loan_disbursement: "Loan Disbursement",
      loan_repayment: "Loan Payment",
    }

    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-gray-600">Monitor, approve, and manage all system transactions</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.pendingVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayPal Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paypalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.paypalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} PayPal volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Avg: ${stats.avgTransactionSize.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions Alert */}
      {stats.pendingTransactions > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.pendingTransactions} pending transactions worth $
            {stats.pendingVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} awaiting your review.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer_in">Money In</SelectItem>
                <SelectItem value="transfer_out">Money Out</SelectItem>
                <SelectItem value="loan_disbursement">Loan Disbursements</SelectItem>
                <SelectItem value="loan_repayment">Loan Payments</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="internal">Internal Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setTypeFilter("all")
                setPaymentMethodFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Account</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Reference</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Payment Method</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-8 text-muted-foreground">
                      No transactions found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {transaction.users?.full_name ||
                              `${transaction.users?.first_name} ${transaction.users?.last_name}` ||
                              "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-500">{transaction.users?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-mono text-sm">
                          {transaction.users?.account_number || transaction.account_no || "N/A"}
                        </div>
                      </td>
                      <td className="p-2">{getTypeBadge(transaction.transaction_type)}</td>
                      <td className="p-2">
                        <div className="font-medium">
                          ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="max-w-xs truncate" title={transaction.narration}>
                          {transaction.narration}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-mono text-sm">{transaction.reference}</div>
                      </td>
                      <td className="p-2">{getStatusBadge(transaction.status)}</td>
                      <td className="p-2">
                        <div className="text-sm">
                          {transaction.payment_method ? (
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {transaction.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveTransaction(transaction)}
                                disabled={processingTransaction === transaction.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {processingTransaction === transaction.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={processingTransaction === transaction.id}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Decline Transaction</DialogTitle>
                                    <DialogDescription>
                                      Please provide a reason for declining this transaction
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="decline-reason">Decline Reason</Label>
                                      <Textarea
                                        id="decline-reason"
                                        value={declineReason}
                                        onChange={(e) => setDeclineReason(e.target.value)}
                                        placeholder="Enter reason for declining this transaction..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="destructive"
                                        onClick={() => declineTransaction(transaction, declineReason)}
                                        disabled={!declineReason.trim() || processingTransaction === transaction.id}
                                        className="flex-1"
                                      >
                                        {processingTransaction === transaction.id ? (
                                          <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Declining...
                                          </>
                                        ) : (
                                          "Decline Transaction"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Transaction Details & Notification</DialogTitle>
                                <DialogDescription>
                                  View transaction details and send notification to user
                                </DialogDescription>
                              </DialogHeader>

                              {selectedTransaction && (
                                <div className="space-y-6">
                                  {/* Transaction Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Transaction ID</Label>
                                      <p className="text-sm font-mono bg-muted p-2 rounded">{selectedTransaction.id}</p>
                                    </div>
                                    <div>
                                      <Label>Reference</Label>
                                      <p className="text-sm font-mono bg-muted p-2 rounded">
                                        {selectedTransaction.reference}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>User</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedTransaction.users?.full_name || "Unknown User"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedTransaction.users?.email || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="text-sm font-medium bg-muted p-2 rounded">
                                        $
                                        {selectedTransaction.amount.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div className="bg-muted p-2 rounded">
                                        {getStatusBadge(selectedTransaction.status)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Send Notification */}
                                  <div className="border-t pt-4 space-y-4">
                                    <h4 className="font-medium">Send Custom Notification</h4>
                                    <div>
                                      <Label htmlFor="title">Title</Label>
                                      <Input
                                        id="title"
                                        value={notificationTitle}
                                        onChange={(e) => setNotificationTitle(e.target.value)}
                                        placeholder="Notification title"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="message">Message</Label>
                                      <Textarea
                                        id="message"
                                        value={notificationMessage}
                                        onChange={(e) => setNotificationMessage(e.target.value)}
                                        placeholder="Notification message"
                                        rows={4}
                                      />
                                    </div>
                                    <Button onClick={sendCustomNotification} className="w-full">
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Notification & Email
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
