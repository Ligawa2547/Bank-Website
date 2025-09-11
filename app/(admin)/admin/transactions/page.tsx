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
import { createClient } from "@supabase/supabase-js"
import { Search, Download, Send, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Transaction {
  id: string
  user_id: string
  type: string
  amount: number
  description: string
  reference: string
  status: string
  payment_method: string
  created_at: string
  user?: {
    full_name: string
    email: string
    account_number: string
  }
}

interface TransactionStats {
  totalTransactions: number
  totalVolume: number
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
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")

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
          user:users(full_name, email, account_number)
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

      const processedTransactions =
        transactionsData?.map((transaction) => ({
          ...transaction,
          user: Array.isArray(transaction.user) ? transaction.user[0] : transaction.user,
        })) || []

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
    const totalVolume = transactionsData.reduce((sum, t) => sum + t.amount, 0)
    const paypalTransactions = transactionsData.filter((t) => t.payment_method?.toLowerCase().includes("paypal")).length
    const paypalVolume = transactionsData
      .filter((t) => t.payment_method?.toLowerCase().includes("paypal"))
      .reduce((sum, t) => sum + t.amount, 0)
    const completedTransactions = transactionsData.filter((t) => t.status === "completed").length
    const successRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
    const avgTransactionSize = totalTransactions > 0 ? totalVolume / totalTransactions : 0

    setStats({
      totalTransactions,
      totalVolume,
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
          transaction.user?.full_name?.toLowerCase().includes(search) ||
          transaction.user?.email?.toLowerCase().includes(search) ||
          transaction.user?.account_number?.toLowerCase().includes(search) ||
          transaction.reference?.toLowerCase().includes(search) ||
          transaction.description?.toLowerCase().includes(search) ||
          transaction.id.toLowerCase().includes(search),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === typeFilter)
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
      transaction.user?.full_name || "N/A",
      transaction.user?.email || "N/A",
      transaction.user?.account_number || "N/A",
      transaction.type,
      transaction.amount,
      transaction.description,
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
  }

  const sendNotificationToUser = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          title: notificationTitle,
          message: notificationMessage,
          sendEmail: true,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent successfully",
        })
        setNotificationTitle("")
        setNotificationMessage("")
        setSelectedUser(null)
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
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  const getTypeBadge = (type: string) => {
    const typeColors = {
      deposit: "bg-blue-100 text-blue-800",
      withdrawal: "bg-orange-100 text-orange-800",
      transfer: "bg-purple-100 text-purple-800",
      payment: "bg-green-100 text-green-800",
    }
    return typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"
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
          <p className="text-gray-600">Monitor and manage all system transactions</p>
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
            <p className="text-xs text-muted-foreground">All time transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalVolume.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total transaction value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PayPal Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paypalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">${stats.paypalVolume.toLocaleString()} volume</p>
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
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
                <SelectItem value="card">Card</SelectItem>
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
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{transaction.user?.full_name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{transaction.user?.email || "N/A"}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-mono text-sm">{transaction.user?.account_number || "N/A"}</div>
                    </td>
                    <td className="p-2">
                      <Badge className={getTypeBadge(transaction.type)}>{transaction.type}</Badge>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">${transaction.amount.toLocaleString()}</div>
                    </td>
                    <td className="p-2">
                      <div className="max-w-xs truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-mono text-sm">{transaction.reference}</div>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">{transaction.payment_method || "N/A"}</div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedUser(transaction)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Notification</DialogTitle>
                            <DialogDescription>Send a notification to {transaction.user?.full_name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
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
                            <Button onClick={sendNotificationToUser} className="w-full">
                              Send Notification & Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
