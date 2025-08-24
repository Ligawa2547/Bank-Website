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
import PayPalPayment from "@/components/paypal-payment"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"

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

export default function TransfersPage() {
  const { user, profile, refreshUserProfile } = useAuth()
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
    if (user) {
      fetchTransactions()
    }
  }, [user])

  useEffect(() => {
    // Handle URL parameters for PayPal callbacks
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "deposit_completed") {
      toast({
        title: "Deposit Successful",
        description: "Your PayPal deposit has been completed successfully.",
      })
      if (refreshUserProfile) {
        refreshUserProfile()
      }
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
  }, [searchParams, toast, refreshUserProfile])

  const fetchTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching transactions:", error)
        setError("Failed to load transactions")
      } else {
        setTransactions(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBankTransfer = async () => {
    if (!recipientAccount || !transferAmount || Number.parseFloat(transferAmount) <= 0) {
      setError("Please fill in all required fields with valid values")
      return
    }

    if (!profile) {
      setError("User profile not available")
      return
    }

    const amount = Number.parseFloat(transferAmount)
    if (amount > (profile.balance || 0)) {
      setError("Insufficient balance")
      return
    }

    setTransferLoading(true)
    setError("")
    setSuccess("")

    try {
      // Use the existing transfer function from the transfers page logic
      const { data: senderData, error: senderError } = await supabase
        .from("users")
        .select("account_balance, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (senderError || !senderData) {
        throw new Error("Failed to verify sender balance")
      }

      const currentBalance = Number.parseFloat(senderData.account_balance?.toString() || "0")

      if (currentBalance < amount) {
        throw new Error(`Insufficient funds. Current balance: $${currentBalance.toFixed(2)}`)
      }

      // Find recipient by account number
      const { data: recipientData, error: recipientError } = await supabase
        .from("users")
        .select("id, account_balance, first_name, last_name, account_number")
        .eq("account_number", recipientAccount)
        .single()

      if (recipientError || !recipientData) {
        throw new Error("Recipient account not found")
      }

      const recipientBalance = Number.parseFloat(recipientData.account_balance?.toString() || "0")
      const newSenderBalance = currentBalance - amount
      const newRecipientBalance = recipientBalance + amount

      // Update sender's balance
      const { error: senderUpdateError } = await supabase
        .from("users")
        .update({
          account_balance: newSenderBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (senderUpdateError) {
        throw new Error("Failed to update sender balance")
      }

      // Update recipient's balance
      const { error: recipientUpdateError } = await supabase
        .from("users")
        .update({
          account_balance: newRecipientBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recipientData.id)

      if (recipientUpdateError) {
        // Rollback sender balance
        await supabase.from("users").update({ account_balance: currentBalance }).eq("id", user.id)
        throw new Error("Failed to update recipient balance")
      }

      // Create transaction records
      const reference = `TXN${Date.now()}`

      // Outgoing transaction for sender
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: "transfer_out",
        status: "completed",
        reference: `${reference}OUT`,
        narration: transferDescription || `Transfer to ${recipientData.first_name} ${recipientData.last_name}`,
        created_at: new Date().toISOString(),
      })

      // Incoming transaction for recipient
      await supabase.from("transactions").insert({
        user_id: recipientData.id,
        amount: amount,
        transaction_type: "transfer_in",
        status: "completed",
        reference: `${reference}IN`,
        narration: transferDescription || `Transfer from ${senderData.first_name} ${senderData.last_name}`,
        created_at: new Date().toISOString(),
      })

      setSuccess("Transfer completed successfully!")
      setRecipientAccount("")
      setTransferAmount("")
      setTransferDescription("")

      // Refresh data
      if (refreshUserProfile) {
        refreshUserProfile()
      }
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
      case "transfer_out":
      case "transfer_in":
        return <Send className="h-4 w-4 text-purple-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transfers & Payments</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your money transfers and payments</p>
        </div>
        {profile && (
          <Card className="w-full sm:w-auto">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">Available Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">${profile.balance?.toFixed(2) || "0.00"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="paypal-deposit" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 min-w-[320px]">
            <TabsTrigger value="paypal-deposit" className="text-xs sm:text-sm px-2 sm:px-4">
              Deposit
            </TabsTrigger>
            <TabsTrigger value="paypal-withdrawal" className="text-xs sm:text-sm px-2 sm:px-4">
              Withdraw
            </TabsTrigger>
            <TabsTrigger value="bank-transfer" className="text-xs sm:text-sm px-2 sm:px-4">
              Transfer
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-4">
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="paypal-deposit" className="space-y-4">
          <PayPalPayment
            type="deposit"
            onSuccess={() => {
              if (refreshUserProfile) {
                refreshUserProfile()
              }
              fetchTransactions()
            }}
          />
        </TabsContent>

        <TabsContent value="paypal-withdrawal" className="space-y-4">
          <PayPalPayment
            type="withdrawal"
            onSuccess={() => {
              if (refreshUserProfile) {
                refreshUserProfile()
              }
              fetchTransactions()
            }}
          />
        </TabsContent>

        <TabsContent value="bank-transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Send className="h-5 w-5 text-purple-600" />
                Bank Transfer
              </CardTitle>
              <CardDescription className="text-sm">Transfer money to another bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="recipient" className="text-sm">
                  Recipient Account Number
                </Label>
                <Input
                  id="recipient"
                  placeholder="Enter recipient account number"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={transferLoading}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-amount" className="text-sm">
                  Amount (USD)
                </Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  disabled={transferLoading}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-description" className="text-sm">
                  Description (Optional)
                </Label>
                <Textarea
                  id="transfer-description"
                  placeholder="Enter transfer description..."
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  disabled={transferLoading}
                  rows={3}
                  className="text-sm"
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
                    Processing...
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
              <CardDescription className="text-sm">Your recent transactions and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base capitalize truncate">
                            {transaction.transaction_type.replace("_", " ")}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{transaction.narration}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <p className="font-medium text-sm sm:text-base">
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                            {transaction.status}
                          </Badge>
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
