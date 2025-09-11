"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Search, Download, Mail, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react"

interface Transaction {
  id: string
  user_id: string
  transaction_type: "deposit" | "withdrawal" | "transfer"
  amount: number
  status: "completed" | "pending" | "failed"
  payment_method: string
  narration: string
  reference: string
  created_at: string
  users: {
    id: string
    email: string
    full_name: string
    first_name: string
    last_name: string
    account_no: string
  }
}

interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  paypalTransactions: number
  paypalAmount: number
  completedTransactions: number
  pendingTransactions: number
  failedTransactions: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    paypalTransactions: 0,
    paypalAmount: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter, typeFilter, paymentMethodFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch all transactions with user data
      const { data: transactionsData, error } = await supabase
        .from("transactions")
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            first_name,
            last_name,
            account_no
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500)

      if (error) {
        console.error("Error fetching transactions:", error)
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        })
        return
      }

      const transactions = transactionsData || []
      setTransactions(transactions)

      // Calculate statistics
      const totalTransactions = transactions.length
      const totalAmount = transactions
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      const paypalTransactions = transactions.filter((t) => t.payment_method?.toLowerCase().includes("paypal")).length

      const paypalAmount = transactions
        .filter((t) => t.payment_method?.toLowerCase().includes("paypal") && t.status === "completed")
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      const completedTransactions = transactions.filter((t) => t.status === "completed").length
      const pendingTransactions = transactions.filter((t) => t.status === "pending").length
      const failedTransactions = transactions.filter((t) => t.status === "failed").length

      setStats({
        totalTransactions,
        totalAmount,
        paypalTransactions,
        paypalAmount,
        completedTransactions,
        pendingTransactions,
        failedTransactions,
      })
    } catch (error) {
      console.error("Error in fetchTransactions:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.users?.email?.toLowerCase().includes(term) ||
          t.users?.full_name?.toLowerCase().includes(term) ||
          t.users?.first_name?.toLowerCase().includes(term) ||
          t.users?.last_name?.toLowerCase().includes(term) ||
          t.users?.account_no?.toLowerCase().includes(term) ||
          t.reference?.toLowerCase().includes(term) ||
          t.narration?.toLowerCase().includes(term) ||
          t.payment_method?.toLowerCase().includes(term),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.transaction_type === typeFilter)
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      if (paymentMethodFilter === "paypal") {
        filtered = filtered.filter((t) => t.payment_method?.toLowerCase().includes("paypal"))
      } else {
        filtered = filtered.filter((t) => t.payment_method === paymentMethodFilter)
      }
    }

    setFilteredTransactions(filtered)
  }

  const exportTransactions = () => {
    const csvContent = [
      [
        "Date",
        "User",
        "Email",
        "Account No",
        "Type",
        "Amount",
        "Status",
        "Payment Method",
        "Reference",
        "Description",
      ].join(","),
      ...filteredTransactions.map((t) =>
        [
          new Date(t.created_at).toLocaleDateString(),
          t.users?.full_name || `${t.users?.first_name} ${t.users?.last_name}` || "N/A",
          t.users?.email || "N/A",
          t.users?.account_no || "N/A",
          t.transaction_type,
          t.amount,
          t.status,
          t.payment_method || "N/A",
          t.reference || "N/A",
          `"${t.narration || "N/A"}"`,
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

    toast({
      title: "Success",
      description: "Transactions exported successfully",
    })
  }

  const sendNotificationToUser = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: "Account Update",
          message: "Your account has been reviewed by our admin team.",
          type: "info",
          sendEmail: true,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Notification sent to ${userEmail}`,
        })
      } else {
        throw new Error("Failed to send notification")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      deposit: "bg-green-100 text-green-800",
      withdrawal: "bg-red-100 text-red-800",
      transfer: "bg-blue-100 text-blue-800",
    }

    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Monitor and manage all platform transactions</p>
        </div>
        <Button onClick={exportTransactions} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

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
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paypalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.paypalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} PayPal volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTransactions > 0
                ? ((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTransactions} completed, {stats.failedTransactions} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
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
            Showing {filteredTransactions.length} of {transactions.length} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <Alert>
              <AlertDescription>No transactions found matching your criteria.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Account</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">
                            {transaction.users?.full_name ||
                              `${transaction.users?.first_name} ${transaction.users?.last_name}` ||
                              "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">{transaction.users?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {transaction.users?.account_no || "N/A"}
                        </code>
                      </td>
                      <td className="p-2">{getTypeBadge(transaction.transaction_type)}</td>
                      <td className="p-2">
                        <span className="font-medium">
                          ${transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
                        </span>
                      </td>
                      <td className="p-2">{getStatusBadge(transaction.status)}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {transaction.payment_method || "N/A"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{transaction.reference || "N/A"}</code>
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendNotificationToUser(transaction.user_id, transaction.users?.email || "")}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Notify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
