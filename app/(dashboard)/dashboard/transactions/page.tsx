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
    if (!user || !profile?.account_number) return

    const fetchTransactions = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching transactions for account:", profile.account_number)

        // Fetch transactions where the user is either sender or recipient
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .or(
            `account_no.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},sender_account_number.eq.${profile.account_number}`,
          )
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching transactions:", error)
          setIsLoading(false)
          return
        }

        console.log(`Found ${data?.length || 0} transactions`)

        if (data && data.length > 0) {
          // Process transactions to ensure correct transaction_type
          const processedData = data.map((transaction) => {
            // If transaction doesn't have a type, determine it based on account numbers
            if (!transaction.transaction_type) {
              if (transaction.sender_account_number === profile.account_number) {
                return { ...transaction, transaction_type: "transfer_out" }
              } else if (transaction.recipient_account_number === profile.account_number) {
                return { ...transaction, transaction_type: "transfer_in" }
              }
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
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle export transactions
  const handleExportTransactions = () => {
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
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Transaction History</h1>

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

              <Button variant="outline" size="icon" title="Export Transactions" onClick={handleExportTransactions}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
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
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3 px-4 text-sm">{new Date(transaction.created_at).toLocaleDateString()}</td>
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
                                      : getTransactionTypeLabel(transaction.transaction_type)}
                          </div>
                          <div className="text-xs text-gray-500">{transaction.narration || "-"}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">{transaction.reference}</td>
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
            <div className="text-center py-12 text-gray-500">No transactions found matching your filters</div>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-[#0A3D62]" : ""}
                  >
                    {page}
                  </Button>
                ))}
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
