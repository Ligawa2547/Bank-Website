"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Download, FileText, Calendar, Filter, Loader2, Eye, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface StatementSummary {
  totalTransactions: number
  totalIncoming: number
  totalOutgoing: number
  dateRange: {
    start: string | null
    end: string | null
  }
}

interface StatementTransaction {
  id: string
  transaction_type: string
  amount: number
  amount_display: string
  status: string
  reference: string
  narration: string
  recipient_name?: string
  sender_name?: string
  created_at: string
}

export default function StatementsPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [transactions, setTransactions] = useState<StatementTransaction[]>([])
  const [summary, setSummary] = useState<StatementSummary | null>(null)

  // Filter states
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [transactionType, setTransactionType] = useState("all")
  const [presetPeriod, setPresetPeriod] = useState("")

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    setEndDate(today.toISOString().split("T")[0])
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0])
  }, [])

  // Handle preset period changes
  const handlePresetPeriodChange = (period: string) => {
    setPresetPeriod(period)
    const today = new Date()
    let start: Date

    switch (period) {
      case "7days":
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30days":
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90days":
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "6months":
        start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())
        break
      case "1year":
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
        break
      case "custom":
        return // Don't change dates for custom
      default:
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    setStartDate(start.toISOString().split("T")[0])
    setEndDate(today.toISOString().split("T")[0])
  }

  // Preview statement data
  const previewStatement = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before end date.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        type: transactionType,
        format: "json",
      })

      const response = await fetch(`/api/statements?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch statement data")
      }

      const data = await response.json()
      setTransactions(data.transactions)
      setSummary(data.summary)

      toast({
        title: "Statement Preview Ready",
        description: `Found ${data.transactions.length} transactions for the selected period.`,
      })
    } catch (error) {
      console.error("Error previewing statement:", error)
      toast({
        title: "Error",
        description: "Failed to preview statement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Download statement in different formats
  const downloadStatement = async (format: "csv" | "pdf") => {
    if (!startDate || !endDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        type: transactionType,
        format,
      })

      const response = await fetch(`/api/statements?${params}`)

      if (!response.ok) {
        throw new Error("Failed to generate statement")
      }

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `statement_${profile?.account_number}_${startDate}_to_${endDate}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Statement Downloaded",
          description: "Your CSV statement has been downloaded successfully.",
        })
      } else if (format === "pdf") {
        // For PDF, we'll implement client-side PDF generation or redirect to a PDF service
        const data = await response.json()

        // Here you could integrate with a PDF generation library like jsPDF or react-pdf
        // For now, we'll show a message that PDF generation is coming soon
        toast({
          title: "PDF Generation",
          description: "PDF statement generation is coming soon. Please use CSV format for now.",
        })
      }
    } catch (error) {
      console.error("Error downloading statement:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download statement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
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

  const getTransactionDescription = (transaction: StatementTransaction) => {
    if (transaction.transaction_type === "deposit") {
      return transaction.narration || "Account deposit"
    } else if (transaction.transaction_type === "withdrawal") {
      return transaction.narration || "Account withdrawal"
    } else if (transaction.transaction_type === "transfer_in") {
      return `From ${transaction.sender_name || "Unknown sender"}`
    } else if (transaction.transaction_type === "transfer_out") {
      return `To ${transaction.recipient_name || "Unknown recipient"}`
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
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your statements</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Account Statements</h1>
        <p className="text-gray-600 mt-1">Generate and download your account statements</p>
      </div>

      {/* Statement Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Statement
          </CardTitle>
          <CardDescription>Select date range and transaction type to generate your account statement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Period Selection */}
          <div className="space-y-2">
            <Label>Quick Select Period</Label>
            <Select value={presetPeriod} onValueChange={handlePresetPeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a preset period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPresetPeriod("custom")
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPresetPeriod("custom")
                }}
              />
            </div>
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="All Transactions" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Deposits Only</SelectItem>
                <SelectItem value="withdrawal">Withdrawals Only</SelectItem>
                <SelectItem value="transfer_in">Money Received</SelectItem>
                <SelectItem value="transfer_out">Money Sent</SelectItem>
                <SelectItem value="loan_disbursement">Loan Disbursements</SelectItem>
                <SelectItem value="loan_repayment">Loan Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={previewStatement}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Preview Statement
            </Button>
            <Button
              onClick={() => downloadStatement("csv")}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download CSV
            </Button>
            <Button
              onClick={() => downloadStatement("pdf")}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statement Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Statement Summary</CardTitle>
            <CardDescription>
              Period: {summary.dateRange.start ? new Date(summary.dateRange.start).toLocaleDateString() : "N/A"} to{" "}
              {summary.dateRange.end ? new Date(summary.dateRange.end).toLocaleDateString() : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalTransactions}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-600">Money In</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalIncoming)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-600">Money Out</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalOutgoing)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Amount</p>
                  <p
                    className={`text-2xl font-bold ${
                      summary.totalIncoming - summary.totalOutgoing >= 0 ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {formatCurrency(summary.totalIncoming - summary.totalOutgoing)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Preview */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Preview</CardTitle>
            <CardDescription>Showing {transactions.length} transactions for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {transactions.slice(0, 50).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{getTransactionDescription(transaction)}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-mono">{transaction.reference}</span>
                      <span>{formatDateTime(transaction.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.amount_display.startsWith("+") ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.amount_display.startsWith("+") ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length > 50 && (
                <div className="text-center py-4 text-gray-500">
                  <p>
                    Showing first 50 transactions. Download full statement to see all {transactions.length}{" "}
                    transactions.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">CSV Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Compatible with Excel and Google Sheets</li>
                <li>• Includes all transaction details</li>
                <li>• Summary information at the top</li>
                <li>• Easy to filter and analyze</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">PDF Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Professional formatted statement</li>
                <li>• Suitable for official purposes</li>
                <li>• Includes account and period details</li>
                <li>• Coming soon...</li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Statements include all transactions for your account during the selected period.
              For security purposes, statements are only available for the account holder and cannot be shared with
              third parties without proper authorization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
