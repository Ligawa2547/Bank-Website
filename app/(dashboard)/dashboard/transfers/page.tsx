"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PayPalPayment } from "@/components/paypal-payment"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  reference: string
  narration: string
  created_at: string
  account_no: string
}

interface User {
  id: string
  account_number: string
  account_balance: number
  first_name: string
  last_name: string
  email: string
}

export default function TransfersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transferLoading, setTransferLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Bank transfer form
  const [recipientAccount, setRecipientAccount] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")

  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchUserData()
    fetchTransactions()

    // Handle URL parameters for PayPal callbacks
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "deposit_completed") {
      toast({
        title: "Deposit Successful",
        description: "Your PayPal deposit has been completed successfully.",
      })
    } else if (error) {
      let errorMessage = "An error occurred"
      switch (error) {
        case "payment_cancelled":
          errorMessage = "Payment was cancelled"
          break
        case "payment_failed":
          errorMessage = "Payment failed to process"
          break
        case "processing_failed":
          errorMessage = "Payment processing failed"
          break
        case "missing_parameters":
          errorMessage = "Missing payment parameters"
          break
      }

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const fetchUserData = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        setError("Please log in to view transfers")
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, account_number, account_balance, first_name, last_name, email")
        .eq("id", authUser.id)
        .single()

      if (error) {
        console.error("Error fetching user data:", error)
        setError("Failed to load user data")
      } else {
        setUser(data)
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) return

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching transactions:", error)
      } else {
        setTransactions(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleBankTransfer = async () => {
    if (!recipientAccount || !transferAmount || Number.parseFloat(transferAmount) <= 0) {
      setError("Please fill in all required fields with valid values")
      return
    }

    if (!user) {
      setError("User data not available")
      return
    }

    const amount = Number.parseFloat(transferAmount)
    if (amount > user.account_balance) {
      setError("Insufficient balance")
      return
    }

    setTransferLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientAccount,
          amount,
          description: transferDescription || "Bank transfer",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Transfer failed")
      }

      setSuccess("Transfer completed successfully!")
      setRecipientAccount("")
      setTransferAmount("")
      setTransferDescription("")

      // Refresh data
      fetchUserData()
      fetchTransactions()

      toast({
        title: "Transfer Successful",
        description: `$${amount.toFixed(2)} has been transferred successfully.`,
      })
    } catch (error: any) {
      console.error("Transfer error:", error)
      setError(error.message)
      toast({
        title: "Transfer Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTransferLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case "transfer":
        return <Send className="h-4 w-4 text-purple-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfers & Payments</h1>
          <p className="text-muted-foreground">Manage your money transfers and payments</p>
        </div>
        {user && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">${user.account_balance?.toFixed(2) || "0.00"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="paypal-deposit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="paypal-deposit">PayPal Deposit</TabsTrigger>
          <TabsTrigger value="paypal-withdrawal">PayPal Withdrawal</TabsTrigger>
          <TabsTrigger value="bank-transfer">Bank Transfer</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="paypal-deposit">
          <PayPalPayment
            type="deposit"
            onSuccess={() => {
              fetchUserData()
              fetchTransactions()
            }}
          />
        </TabsContent>

        <TabsContent value="paypal-withdrawal">
          <PayPalPayment
            type="withdrawal"
            onSuccess={() => {
              fetchUserData()
              fetchTransactions()
            }}
          />
        </TabsContent>

        <TabsContent value="bank-transfer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                Bank Transfer
              </CardTitle>
              <CardDescription>Transfer money to another bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Account Number</Label>
                <Input
                  id="recipient"
                  placeholder="Enter recipient account number"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={transferLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount (USD)</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  disabled={transferLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-description">Description (Optional)</Label>
                <Textarea
                  id="transfer-description"
                  placeholder="Enter transfer description..."
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  disabled={transferLoading}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleBankTransfer}
                disabled={transferLoading || !recipientAccount || !transferAmount}
                className="w-full"
                size="lg"
              >
                {transferLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Transfer...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Transfer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent transactions and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium capitalize">{transaction.transaction_type}</p>
                          <p className="text-sm text-muted-foreground">{transaction.narration}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(transaction.status)}
                          <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
