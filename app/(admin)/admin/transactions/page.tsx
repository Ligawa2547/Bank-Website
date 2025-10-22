"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download } from "lucide-react"

interface Transaction {
  id: string
  account_no: string
  type: string
  amount: number
  balance_after: number
  status: string
  reference: string
  description: string
  created_at: string
  user_name?: string
  user_email?: string
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, statusFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (txError) throw txError

      // Fetch users separately
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("account_no, first_name, last_name, email")

      if (usersError) throw usersError

      // Create a map for quick user lookup
      const userMap = new Map(usersData?.map((u: any) => [u.account_no, u]) || [])

      // Combine transactions with user data
      const enrichedTransactions = txData.map((tx: any) => {
        const user = userMap.get(tx.account_no)
        return {
          ...tx,
          user_name: user ? `${user.first_name} ${user.last_name}` : "Unknown",
          user_email: user?.email || "N/A",
        }
      })

      setTransactions(enrichedTransactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.reference.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => tx.status === statusFilter)
    }

    setFilteredTransactions(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Date", "Account No", "User Name", "Type", "Amount", "Status", "Reference"]
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.account_no,
      tx.user_name,
      tx.type,
      `$${tx.amount.toFixed(2)}`,
      tx.status,
      tx.reference,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
        <p className="text-muted-foreground mt-2">View and manage all user transactions</p>
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by account, user, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
        <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto bg-transparent">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Account</th>
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-mono text-xs">{tx.account_no}</td>
                      <td className="py-3 px-4">{tx.user_name}</td>
                      <td className="py-3 px-4 capitalize">{tx.type}</td>
                      <td className="py-3 px-4 text-right font-medium">${tx.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">{tx.reference}</td>
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
