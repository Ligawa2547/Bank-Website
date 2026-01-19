"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Building2,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { createBrowserClient } from "@supabase/ssr"
import type { Transaction } from "@/types/user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function TransactionsPage() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!user || !profile?.account_number) {
      setIsLoading(false)
      return
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching transactions for account:", profile.account_number)

        // Fetch transactions where the user's account is involved
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},account_no.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })
          .limit(100) // Limit to last 100 transactions for performance

        if (error) {
          console.error("Error fetching transactions:", error)
          setTransactions([])
          setFilteredTransactions([])
          return
        }

        console.log(`Found ${data?.length || 0} transactions for account ${profile.account_number}`)

        if (data && data.length > 0) {
          // Process transactions to determine the correct type from user's perspective
          const processedData = data.map((transaction) => {
            const processedTransaction = { ...transaction }

            // Determine transaction type from the perspective of the logged-in user
            if (transaction.sender_account_number === profile.account_number) {
              // User is sending money
              processedTransaction.transaction_type = "transfer_out"
            } else if (transaction.recipient_account_number === profile.account_number) {
              // User is receiving money
              processedTransaction.transaction_type = "transfer_in"
            }
            // For other types (deposit, withdrawal, loan_disbursement, loan_repayment), keep original type

            return processedTransaction
          })

          setTransactions(processedData)
          setFilteredTransactions(processedData)
        } else {
          setTransactions([])
          setFilteredTransactions([])
        }
      } catch (err) {
        console.error("Unexpected error fetching transactions:", err)
        setTransactions([])
        setFilteredTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user, profile, supabase])

  useEffect(() => {
    // Apply filters
    let filtered = [...transactions]

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.transaction_type === typeFilter)
    }

    // Date filter
    const now = new Date()
    if (dateFilter === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      filtered = filtered.filter((t) => t.created_at >= today)
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
      filtered = filtered.filter((t) => t.created_at >= weekAgo)
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
      filtered = filtered.filter((t) => t.created_at >= monthAgo)
    } else if (dateFilter === "3months") {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString()
      filtered = filtered.filter((t) => t.created_at >= threeMonthsAgo)
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.narration?.toLowerCase().includes(query) ||
          t.reference?.toLowerCase().includes(query) ||
          t.recipient_name?.toLowerCase().includes(query) ||
          t.sender_name?.toLowerCase().includes(query) ||
          t.recipient_account_number?.includes(query) ||
          t.sender_account_number?.includes(query),
      )
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [transactions, typeFilter, dateFilter, searchQuery])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })
    }
  }

  const getTransactionIcon = (type: string) => {
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

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.transaction_type === "deposit") {
      return transaction.narration || "Account deposit"
    } else if (transaction.transaction_type === "withdrawal") {
      return transaction.narration || "Account withdrawal"
    } else if (transaction.transaction_type === "transfer_in") {
      const senderName = transaction.sender_name || "Unknown sender"
      return `From ${senderName}`
    } else if (transaction.transaction_type === "transfer_out") {
      const recipientName = transaction.recipient_name || "Unknown recipient"
      return `To ${recipientName}`
    } else if (transaction.transaction_type === "loan_disbursement") {
      return transaction.narration || "Loan disbursement"
    } else if (transaction.transaction_type === "loan_repayment") {
      return transaction.narration || "Loan repayment"
    }
    return transaction.narration || "Transaction"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Calculate summary statistics
  const totalIncoming = filteredTransactions
    .filter(
      (t) =>
        t.transaction_type === "deposit" ||
        t.transaction_type === "transfer_in" ||
        t.transaction_type === "loan_disbursement",
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const totalOutgoing = filteredTransactions
    .filter(
      (t) =>
        t.transaction_type === "withdrawal" ||
        t.transaction_type === "transfer_out" ||
        t.transaction_type === "loan_repayment",
    )
    .reduce((sum, t) => sum + t.amount, 0)

  // Handle export transactions
  const handleExportTransactions = () => {
    if (filteredTransactions.length === 0) {
      console.log("No transactions to export")
      return
    }

    try {
      // Create CSV content
      let csvContent = "Date,Type,Description,Reference,Status,Amount,Balance Impact\n"

      filteredTransactions.forEach((transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString()
        const type = getTransactionTypeLabel(transaction.transaction_type)
        const description = getTransactionDescription(transaction)
        const status = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)

        const amount = transaction.amount
        let balanceImpact = "+"
        if (
          transaction.transaction_type === "withdrawal" ||
          transaction.transaction_type === "transfer_out" ||
          transaction.transaction_type === "loan_repayment"
        ) {
          balanceImpact = "-"
        }

        // Escape quotes in description
        const escapedDescription = description.replace(/"/g, '""')

        csvContent += `"${date}","${type}","${escapedDescription}","${transaction.reference}","${status}",${amount},"${balanceImpact}${amount}"\n`
      })

      // Create download link
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute(
        "download",
        `transactions_${profile?.account_number}_${new Date().toISOString().split("T")[0]}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("Export successful")
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transaction History</h1>
          <p className="text-gray-600 mt-1">
            Account: {profile.account_number} • {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportTransactions}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money In</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncoming)}</p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money Out</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutgoing)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Flow</p>
                <p
                  className={`text-2xl font-bold ${totalIncoming - totalOutgoing >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(totalIncoming - totalOutgoing)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions, names, or references..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Types" />
                  </div>
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

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="All Time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : paginatedTransactions.length > 0 ? (
            <div className="space-y-4">
              {paginatedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getTransactionIcon(transaction.transaction_type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{getTransactionDescription(transaction)}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500 font-mono">{transaction.reference}</p>
                        <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.transaction_type === "deposit" ||
                        transaction.transaction_type === "transfer_in" ||
                        transaction.transaction_type === "loan_disbursement"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.transaction_type === "deposit" ||
                      transaction.transaction_type === "transfer_in" ||
                      transaction.transaction_type === "loan_disbursement"
                        ? "+"
                        : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <Search className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-sm">
                {searchQuery || typeFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search filters"
                  : "You haven't made any transactions yet"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-[#0A3D62]" : ""}
                    >
                      {page}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
