"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Transaction } from "@/types/user"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TransactionsPage() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile?.account_number) {
      setIsLoading(false)
      return
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching transactions for user:", user.id, "account:", profile.account_number)

        // Fetch transactions where the logged-in user is involved
        // This includes transactions where they are the sender OR recipient
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `user_id.eq.${user.id},account_no.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},sender_account_number.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching transactions:", error)
          setTransactions([])
          setFilteredTransactions([])
          setIsLoading(false)
          return
        }

        console.log(`Found ${data?.length || 0} transactions for user`)

        if (data && data.length > 0) {
          // Process transactions to ensure correct transaction_type for the logged-in user
          const processedData = data.map((transaction) => {
            // Determine transaction type from the perspective of the logged-in user
            if (transaction.user_id === user.id) {
              // This is a direct transaction by the user (deposit, withdrawal, loan, etc.)
              return transaction
            } else if (transaction.recipient_account_number === profile.account_number) {
              // User is receiving money
              return { ...transaction, transaction_type: "transfer_in" }
            } else if (transaction.sender_account_number === profile.account_number) {
              // User is sending money
              return { ...transaction, transaction_type: "transfer_out" }
            }
            return transaction
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
    }).format(amount)
  }

  const getTransactionTypeLabel = (type: string) => {
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
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle export transactions
  const handleExportTransactions = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export")
      return
    }

    // Create CSV content
    let csvContent = "Date,Description,Reference,Status,Amount\n"

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString()
      let description = ""

      if (transaction.transaction_type === "deposit") {
        description = "Deposit"
      } else if (transaction.transaction_type === "withdrawal") {
        description = "Withdrawal"
      } else if (transaction.transaction_type === "transfer_in") {
        description = `From ${transaction.sender_name || transaction.sender_account_number || "Unknown"}`
      } else if (transaction.transaction_type === "transfer_out") {
        description = `To ${transaction.recipient_name || transaction.recipient_account_number || "Unknown"}`
      } else if (transaction.transaction_type === "loan_disbursement") {
        description = "Loan Disbursement"
      } else if (transaction.transaction_type === "loan_repayment") {
        description = "Loan Repayment"
      }

      if (transaction.narration) {
        description += ` - ${transaction.narration}`
      }

      // Escape quotes in description
      description = description.replace(/"/g, '""')

      const status = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)

      let amount = transaction.amount
      if (transaction.transaction_type === "withdrawal" || transaction.transaction_type === "transfer_out") {
        amount = -amount
      }

      csvContent += `"${date}","${description}","${transaction.reference}","${status}",${amount}\n`
    })

    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `my_transactions_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Transaction History</h1>
        <p className="text-gray-600">View all your account transactions and activities</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
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
                  <SelectItem value="transfer_in">Transfers In</SelectItem>
                  <SelectItem value="transfer_out">Transfers Out</SelectItem>
                  <SelectItem value="loan_disbursement">Loan Disbursements</SelectItem>
                  <SelectItem value="loan_repayment">Loan Repayments</SelectItem>
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
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                title="Export Transactions"
                onClick={handleExportTransactions}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : paginatedTransactions.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Description</th>
                      <th className="text-left py-3 px-4 font-medium">Reference</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {transaction.transaction_type === "deposit"
                              ? "Deposit"
                              : transaction.transaction_type === "withdrawal"
                                ? "Withdrawal"
                                : transaction.transaction_type === "transfer_in"
                                  ? `From ${transaction.sender_name || transaction.sender_account_number || "Unknown"}`
                                  : transaction.transaction_type === "transfer_out"
                                    ? `To ${transaction.recipient_name || transaction.recipient_account_number || "Unknown"}`
                                    : transaction.transaction_type === "loan_disbursement"
                                      ? "Loan Disbursement"
                                      : transaction.transaction_type === "loan_repayment"
                                        ? "Loan Repayment"
                                        : getTransactionTypeLabel(transaction.transaction_type)}
                          </div>
                          <div className="text-xs text-gray-500">{transaction.narration || "-"}</div>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">{transaction.reference}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-medium ${
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
