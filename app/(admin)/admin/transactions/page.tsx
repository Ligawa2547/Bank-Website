"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Download,
  Eye,
  Send,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Banknote,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Transaction {
  id: string
  user_id: string
  account_no: string
  transaction_type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "loan_disbursement" | "loan_repayment"
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  reference: string
  narration: string
  recipient_account_number?: string
  recipient_name?: string
  sender_account_number?: string
  sender_name?: string
  payment_method?: string
  created_at: string
  updated_at?: string
  metadata?: any
  users?: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone_number: string
    account_number: string
  }
}

interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  pendingCount: number
  completedCount: number
  failedCount: number
  todayTransactions: number
  todayAmount: number
  paypalTransactions: number
  paypalAmount: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    pendingCount: 0,
    completedCount: 0,
    failedCount: 0,
    todayTransactions: 0,
    todayAmount: 0,
    paypalTransactions: 0,
    paypalAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
    fetchStats()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError("")

      // Fetch all transactions with user information
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          users!transactions_account_no_fkey (
            id,
            email,
            first_name,
            last_name,
            phone_number,
            account_number
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500) // Increased limit to get more transactions

      if (transactionsError) {
        console.error("Transactions query error:", transactionsError)
        throw transactionsError
      }

      console.log(`Fetched ${transactionsData?.length || 0} transactions`)

      // Process transactions to ensure we have all data
      const processedTransactions = (transactionsData || []).map((transaction) => ({
        ...transaction,
        users: transaction.users || {
          id: "",
          email: "N/A",
          first_name: "Unknown",
          last_name: "User",
          phone_number: "N/A",
          account_number: transaction.account_no || "N/A",
        },
      }))

      setTransactions(processedTransactions)
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch transactions")
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: transactionsData, error } = await supabase
        .from("transactions")
        .select("amount, status, created_at, payment_method, transaction_type")

      if (error) {
        throw error
      }

      if (!transactionsData) {
        return
      }

      const today = new Date().toISOString().split("T")[0]
      const todayTransactions = transactionsData.filter((t) => t.created_at?.startsWith(today))
      const paypalTransactions = transactionsData.filter(
        (t) =>
          t.payment_method === "paypal" ||
          t.payment_method === "paypal_card" ||
          (t.narration && t.narration.toLowerCase().includes("paypal")),
      )

      const stats: TransactionStats = {
        totalTransactions: transactionsData.length,
        totalAmount: transactionsData.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        pendingCount: transactionsData.filter((t) => t.status === "pending").length,
        completedCount: transactionsData.filter((t) => t.status === "completed").length,
        failedCount: transactionsData.filter((t) => t.status === "failed").length,
        todayTransactions: todayTransactions.length,
        todayAmount: todayTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        paypalTransactions: paypalTransactions.length,
        paypalAmount: paypalTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      }

      setStats(stats)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }

  const sendNotification = async (userId: string) => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive",
      })
      return
    }

    try {
      setNotificationLoading(true)

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          sendEmail: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send notification")
      }

      toast({
        title: "Notification Sent",
        description: `Notification sent successfully to user. Email also sent to ${selectedTransaction?.users?.email || "user"}.`,
      })

      setNotificationForm({
        title: "",
        message: "",
        type: "info",
      })

      setSelectedTransaction(null)
    } catch (err) {
      console.error("Error sending notification:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setNotificationLoading(false)
    }
  }

  const exportTransactions = () => {
    try {
      const csvContent = [
        [
          "ID",
          "User Email",
          "User Name",
          "Account Number",
          "Type",
          "Amount",
          "Status",
          "Payment Method",
          "Description",
          "Reference",
          "Created At",
        ].join(","),
        ...filteredTransactions.map((t) =>
          [
            t.id,
            t.users?.email || "N/A",
            `${t.users?.first_name || "Unknown"} ${t.users?.last_name || "User"}`,
            t.users?.account_number || t.account_no || "N/A",
            t.transaction_type,
            t.amount,
            t.status,
            t.payment_method || "N/A",
            `"${t.narration || ""}"`,
            t.reference || "",
            new Date(t.created_at).toLocaleString(),
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `admin-transactions-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Transactions exported to CSV file",
      })
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "text-yellow-700 bg-yellow-100",
      completed: "text-green-700 bg-green-100",
      failed: "text-red-700 bg-red-100",
      cancelled: "text-gray-700 bg-gray-100",
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer_in":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "transfer_out":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "loan_disbursement":
        return <Building2 className="h-4 w-4 text-blue-600" />
      case "loan_repayment":
        return <CreditCard className="h-4 w-4 text-orange-600" />
      default:
        return <Banknote className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "transfer_in":
        return "Money Received"
      case "transfer_out":
        return "Money Sent"
      case "loan_disbursement":
        return "Loan Disbursement"
      case "loan_repayment":
        return "Loan Payment"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      transaction.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.users?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.users?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.narration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.users?.account_number?.includes(searchTerm) ||
      transaction.account_no?.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Monitor and manage all user transactions</p>
        </div>
        <Button onClick={exportTransactions} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayPal Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.paypalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.paypalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} via PayPal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTransactions}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.todayAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalTransactions > 0 ? Math.round((stats.completedCount / stats.totalTransactions) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCount} completed, {stats.failedCount} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by email, name, account, reference, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="transfer_in">Money Received</SelectItem>
                  <SelectItem value="transfer_out">Money Sent</SelectItem>
                  <SelectItem value="loan_disbursement">Loan Disbursements</SelectItem>
                  <SelectItem value="loan_repayment">Loan Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            {filteredTransactions.length === transactions.length
              ? "Showing all transactions"
              : `Showing ${filteredTransactions.length} of ${transactions.length} transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Account</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Payment Method</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      {transactions.length === 0 ? "No transactions found" : "No transactions match your filters"}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {transaction.users?.first_name || "Unknown"} {transaction.users?.last_name || "User"}
                          </div>
                          <div className="text-sm text-muted-foreground">{transaction.users?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-mono text-sm">
                          {transaction.users?.account_number || transaction.account_no || "N/A"}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.transaction_type)}
                          <span className="text-sm">{getTransactionTypeLabel(transaction.transaction_type)}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">
                          ${Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {transaction.payment_method ? (
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method === "paypal_card"
                                ? "PayPal Card"
                                : transaction.payment_method === "paypal"
                                  ? "PayPal"
                                  : transaction.payment_method.charAt(0).toUpperCase() +
                                    transaction.payment_method.slice(1)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">{getStatusBadge(transaction.status)}</td>
                      <td className="p-2">
                        <div className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>View transaction information and send notifications</DialogDescription>
                            </DialogHeader>

                            {selectedTransaction && (
                              <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details">Details</TabsTrigger>
                                  <TabsTrigger value="notify">Send Notification</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Transaction ID</Label>
                                      <p className="text-sm font-mono bg-muted p-2 rounded">{selectedTransaction.id}</p>
                                    </div>
                                    <div>
                                      <Label>Reference</Label>
                                      <p className="text-sm font-mono bg-muted p-2 rounded">
                                        {selectedTransaction.reference || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>User Email</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedTransaction.users?.email || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>User Name</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedTransaction.users?.first_name || "Unknown"}{" "}
                                        {selectedTransaction.users?.last_name || "User"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Account Number</Label>
                                      <p className="text-sm font-mono bg-muted p-2 rounded">
                                        {selectedTransaction.users?.account_number ||
                                          selectedTransaction.account_no ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Payment Method</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedTransaction.payment_method || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Type</Label>
                                      <div className="flex items-center gap-2 bg-muted p-2 rounded">
                                        {getTypeIcon(selectedTransaction.transaction_type)}
                                        <span className="text-sm">
                                          {getTransactionTypeLabel(selectedTransaction.transaction_type)}
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Status</Label>
                                      <div className="bg-muted p-2 rounded">
                                        {getStatusBadge(selectedTransaction.status)}
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Amount</Label>
                                      <p className="text-sm font-medium bg-muted p-2 rounded">
                                        $
                                        {Number(selectedTransaction.amount || 0).toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <Label>Created</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {new Date(selectedTransaction.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {selectedTransaction.narration && (
                                    <div>
                                      <Label>Description</Label>
                                      <p className="text-sm bg-muted p-2 rounded">{selectedTransaction.narration}</p>
                                    </div>
                                  )}

                                  {selectedTransaction.metadata && (
                                    <div>
                                      <Label>Metadata</Label>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                        {JSON.stringify(selectedTransaction.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent value="notify" className="space-y-4">
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="notif-title">Notification Title</Label>
                                      <Input
                                        id="notif-title"
                                        value={notificationForm.title}
                                        onChange={(e) =>
                                          setNotificationForm((prev) => ({ ...prev, title: e.target.value }))
                                        }
                                        placeholder="Enter notification title..."
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="notif-message">Message</Label>
                                      <Textarea
                                        id="notif-message"
                                        value={notificationForm.message}
                                        onChange={(e) =>
                                          setNotificationForm((prev) => ({ ...prev, message: e.target.value }))
                                        }
                                        placeholder="Enter notification message..."
                                        rows={4}
                                      />
                                    </div>

                                    <div>
                                      <Label htmlFor="notif-type">Type</Label>
                                      <Select
                                        value={notificationForm.type}
                                        onValueChange={(value: "info" | "success" | "warning" | "error") =>
                                          setNotificationForm((prev) => ({ ...prev, type: value }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="info">Info</SelectItem>
                                          <SelectItem value="success">Success</SelectItem>
                                          <SelectItem value="warning">Warning</SelectItem>
                                          <SelectItem value="error">Error</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <Alert>
                                      <Bell className="h-4 w-4" />
                                      <AlertDescription>
                                        This notification will be sent to{" "}
                                        <strong>{selectedTransaction.users?.email || "the user"}</strong> both in-app
                                        and via email.
                                      </AlertDescription>
                                    </Alert>

                                    <Button
                                      onClick={() =>
                                        selectedTransaction && sendNotification(selectedTransaction.user_id)
                                      }
                                      disabled={
                                        notificationLoading ||
                                        !notificationForm.title.trim() ||
                                        !notificationForm.message.trim()
                                      }
                                      className="w-full"
                                    >
                                      {notificationLoading ? (
                                        <>
                                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                          Sending...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="h-4 w-4 mr-2" />
                                          Send Notification & Email
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
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
