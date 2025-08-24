"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PayPalPayment } from "@/components/paypal-payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  Send,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useSearchParams } from "next/navigation"

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  narration: string
  created_at: string
  reference: string
}

interface UserProfile {
  account_no: string
  account_balance: number
  first_name: string
  last_name: string
}

export default function TransfersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [transferAmount, setTransferAmount] = useState("")
  const [recipientAccount, setRecipientAccount] = useState("")
  const [transferDescription, setTransferDescription] = useState("")
  const [transferLoading, setTransferLoading] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Handle URL parameters for success/error messages
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success) {
      let message = "Operation completed successfully"
      switch (success) {
        case "deposit_completed":
          message = "PayPal deposit completed successfully!"
          break
        case "withdrawal_completed":
          message = "PayPal withdrawal completed successfully!"
          break
      }
      toast({
        title: "Success",
        description: message,
      })
    } else if (error) {
      let message = "An error occurred"
      switch (error) {
        case "deposit_cancelled":
          message = "PayPal deposit was cancelled"
          break
        case "withdrawal_cancelled":
          message = "PayPal withdrawal was cancelled"
          break
        case "payment_failed":
          message = "Payment failed. Please try again."
          break
        case "processing_failed":
          message = "Payment processing failed. Please try again."
          break
        case "missing_parameters":
          message = "Missing payment parameters"
          break
        case "user_not_found":
          message = "User not found"
          break
        case "balance_update_failed":
          message = "Failed to update balance"
          break
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  const fetchData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error:", authError)
        return
      }

      // Fetch profile with actual account_balance
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("account_no, account_balance, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("Error fetching profile:", profileError)
      } else {
        setProfile(profileData)
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
      } else {
        setTransactions(transactionsData || [])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleBankTransfer = async () => {
    if (!transferAmount || !recipientAccount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!profile) {
      toast({
        title: "Error",
        description: "Profile not loaded",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(transferAmount)
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (amount > profile.account_balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds for this transfer",
        variant: "destructive",
      })
      return
    }

    setTransferLoading(true)

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientAccount,
          amount,
          description: transferDescription || `Transfer to ${recipientAccount}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Transfer failed")
      }

      toast({
        title: "Transfer Successful",
        description: `$${amount.toFixed(2)} has been transferred to ${recipientAccount}`,
      })

      // Reset form
      setTransferAmount("")
      setRecipientAccount("")
      setTransferDescription("")

      // Refresh data
      fetchData()
    } catch (error: any) {
      console.error("Transfer error:", error)
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      })
    } finally {
      setTransferLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "transfer":
        return <Send className="h-4 w-4 text-blue-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50"
      case "pending":
        return "text-yellow-600 bg-yellow-50"
      case "failed":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfers & Payments</h1>
        <p className="text-gray-600">Add money, withdraw funds, or transfer to other accounts</p>
      </div>

      {profile && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Available Balance: <strong>{formatCurrency(profile.account_balance)}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <div>
          <Tabs defaultValue="paypal-deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1">
              <TabsTrigger
                value="paypal-deposit"
                className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                PayPal Payments
              </TabsTrigger>
              <TabsTrigger
                value="bank-transfer"
                className="text-xs sm:text-sm px-2 py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                Bank Transfer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paypal-deposit" className="mt-4">
              <PayPalPayment onSuccess={fetchData} />
            </TabsContent>

            <TabsContent value="bank-transfer" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Bank Transfer
                  </CardTitle>
                  <CardDescription>Transfer money to another account within our bank</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Account Number</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter account number"
                      value={recipientAccount}
                      onChange={(e) => setRecipientAccount(e.target.value)}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-description">Description (Optional)</Label>
                    <Textarea
                      id="transfer-description"
                      placeholder="Enter a description for this transfer"
                      value={transferDescription}
                      onChange={(e) => setTransferDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleBankTransfer}
                    disabled={transferLoading || !transferAmount || !recipientAccount}
                    className="w-full"
                  >
                    {transferLoading ? "Processing..." : `Transfer $${transferAmount || "0.00"}`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.narration}</p>
                          <p className="text-xs text-gray-600">{formatDate(transaction.created_at)}</p>
                          <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            transaction.transaction_type === "deposit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "deposit" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {getStatusIcon(transaction.status)}
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
