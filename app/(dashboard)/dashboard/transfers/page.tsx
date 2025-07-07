"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/lib/auth-provider"
import { ArrowUpDown, Send, Clock, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: string
  amount: number
  description: string
  transaction_type: string
  status: string
  created_at: string
  recipient_name?: string
  sender_name?: string
}

const TransfersPage = () => {
  const { user, profile, refreshUserProfile } = useAuth()
  const [amount, setAmount] = useState("")
  const [recipientAccount, setRecipientAccount] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentTransfers, setRecentTransfers] = useState<Transaction[]>([])
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchRecentTransfers()
    }
  }, [user])

  const fetchRecentTransfers = async () => {
    if (!user) return

    setIsLoadingTransfers(true)
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .in("transaction_type", ["transfer_out", "transfer_in"])
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching transfers:", error)
        return
      }

      setRecentTransfers(data || [])
    } catch (error) {
      console.error("Error fetching transfers:", error)
    } finally {
      setIsLoadingTransfers(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    const transferAmount = Number.parseFloat(amount)

    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (!recipientAccount.trim()) {
      toast({
        title: "Missing Recipient",
        description: "Please enter the recipient's account number",
        variant: "destructive",
      })
      return
    }

    if (recipientAccount === profile.account_number) {
      toast({
        title: "Invalid Transfer",
        description: "You cannot transfer money to yourself",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check sender's balance using account_balance column
      const { data: senderData, error: senderError } = await supabase
        .from("users")
        .select("account_balance, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (senderError) {
        console.error("Error fetching sender data:", senderError)
        throw new Error("Failed to verify sender balance.")
      }

      if (!senderData) {
        throw new Error("Sender account not found.")
      }

      const currentBalance = Number.parseFloat(senderData.account_balance?.toString() || "0")

      if (currentBalance < transferAmount) {
        toast({
          title: "Insufficient Funds",
          description: `Your current balance is $${currentBalance.toFixed(2)}. You cannot transfer $${transferAmount.toFixed(2)}.`,
          variant: "destructive",
        })
        return
      }

      // Find recipient by account number
      const { data: recipientData, error: recipientError } = await supabase
        .from("users")
        .select("id, account_balance, first_name, last_name, account_number")
        .eq("account_number", recipientAccount)
        .single()

      if (recipientError || !recipientData) {
        toast({
          title: "Recipient Not Found",
          description: "The recipient account number does not exist",
          variant: "destructive",
        })
        return
      }

      const recipientBalance = Number.parseFloat(recipientData.account_balance?.toString() || "0")
      const newSenderBalance = currentBalance - transferAmount
      const newRecipientBalance = recipientBalance + transferAmount

      // Update sender's balance
      const { error: senderUpdateError } = await supabase
        .from("users")
        .update({
          account_balance: newSenderBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (senderUpdateError) {
        console.error("Error updating sender balance:", senderUpdateError)
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
        console.error("Error updating recipient balance:", recipientUpdateError)
        // Rollback sender balance
        await supabase.from("users").update({ account_balance: currentBalance }).eq("id", user.id)
        throw new Error("Failed to update recipient balance")
      }

      // Create outgoing transaction record for sender
      const { error: outgoingError } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: -transferAmount,
        description: description || `Transfer to ${recipientData.first_name} ${recipientData.last_name}`,
        transaction_type: "transfer_out",
        status: "completed",
        recipient_name: `${recipientData.first_name} ${recipientData.last_name}`,
        reference: `TXN${Date.now()}OUT`,
        created_at: new Date().toISOString(),
      })

      if (outgoingError) {
        console.error("Error creating outgoing transaction:", outgoingError)
      }

      // Create incoming transaction record for recipient
      const { error: incomingError } = await supabase.from("transactions").insert({
        user_id: recipientData.id,
        amount: transferAmount,
        description: description || `Transfer from ${senderData.first_name} ${senderData.last_name}`,
        transaction_type: "transfer_in",
        status: "completed",
        sender_name: `${senderData.first_name} ${senderData.last_name}`,
        reference: `TXN${Date.now()}IN`,
        created_at: new Date().toISOString(),
      })

      if (incomingError) {
        console.error("Error creating incoming transaction:", incomingError)
      }

      // Refresh user profile to update balance
      await refreshUserProfile()

      // Refresh recent transfers
      await fetchRecentTransfers()

      toast({
        title: "Transfer Successful",
        description: `Successfully transferred $${transferAmount.toFixed(2)} to ${recipientData.first_name} ${recipientData.last_name}`,
      })

      // Reset form
      setAmount("")
      setRecipientAccount("")
      setDescription("")
    } catch (error: any) {
      console.error("Transfer error:", error)
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transfers</h1>
        <p className="text-gray-600 mt-1">Send money to other accounts instantly</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transfer Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Send Money</span>
            </CardTitle>
            <CardDescription>Transfer funds to another account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="recipient">Recipient Account Number</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="Enter account number"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="What's this for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-[#0A3D62] hover:bg-[#0F5585]">
                {isLoading ? "Processing..." : "Send Money"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Your current account balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-3xl font-bold text-[#0A3D62] mb-2">
                {profile ? formatCurrency(profile.balance || 0) : "Loading..."}
              </div>
              <p className="text-gray-600">Available for transfer</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Your Account:</strong> {profile?.account_number || "Loading..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpDown className="h-5 w-5" />
            <span>Recent Transfers</span>
          </CardTitle>
          <CardDescription>Your latest transfer activity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransfers ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
              <span className="ml-2">Loading transfers...</span>
            </div>
          ) : recentTransfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transfers yet</p>
              <p className="text-sm">Your transfer history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <p className="font-medium">{transfer.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transfer.created_at).toLocaleDateString()} at{" "}
                        {new Date(transfer.created_at).toLocaleTimeString()}
                      </p>
                      {transfer.recipient_name && (
                        <p className="text-sm text-gray-500">To: {transfer.recipient_name}</p>
                      )}
                      {transfer.sender_name && <p className="text-sm text-gray-500">From: {transfer.sender_name}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transfer.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {transfer.amount > 0 ? "+" : ""}
                      {formatCurrency(transfer.amount)}
                    </p>
                    {getStatusBadge(transfer.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransfersPage
