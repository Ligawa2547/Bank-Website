"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { WooshPayPayment } from "@/components/wooshpay-payment"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function TransfersPage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [recipientAccount, setRecipientAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [narration, setNarration] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [recipientId, setRecipientId] = useState("")
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Check for WooshPay callback
  useEffect(() => {
    const reference = searchParams.get("reference")
    const status = searchParams.get("status")

    if (reference && status === "success") {
      setIsVerifying(true)

      // Verify the payment
      fetch(`/api/wooshpay/verify?reference=${reference}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            setDepositSuccess(true)
            // Refresh user profile to get updated balance
            refreshUserProfile()
          } else {
            setError("Payment verification failed. Please contact support.")
          }
        })
        .catch((err) => {
          console.error("Verification error:", err)
          setError("An error occurred while verifying your payment.")
        })
        .finally(() => {
          setIsVerifying(false)
        })
    }
  }, [searchParams, refreshUserProfile])

  const handleVerifyAccount = async () => {
    if (!recipientAccount) return

    setIsLoading(true)
    setRecipientName("")
    setRecipientId("")
    setError("")

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .eq("account_no", recipientAccount)
        .single()

      if (error || !data) {
        setError("Account not found. Please check the account number and try again.")
        return
      }

      setRecipientName(`${data.first_name} ${data.last_name}`)
      setRecipientId(data.id)
    } catch (err) {
      console.error("Error verifying account:", err)
      setError("An error occurred while verifying the account.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipientAccount || !amount || !recipientName) {
      setError("Please fill in all required fields and verify the recipient account.")
      return
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.")
      return
    }

    if (!user || !profile) {
      setError("You must be logged in to make a transfer.")
      return
    }

    if (Number(amount) > profile.balance) {
      setError("Insufficient balance.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Generate a unique reference
      const reference = `trf_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
      const transferAmount = Number(amount)

      // Get current balances
      const { data: senderData, error: senderError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("id", user.id)
        .single()

      if (senderError || !senderData) {
        setError("Failed to verify sender balance.")
        return
      }

      const { data: recipientData, error: recipientError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("id", recipientId)
        .single()

      if (recipientError || !recipientData) {
        setError("Failed to verify recipient account.")
        return
      }

      // Check balance again
      if (transferAmount > senderData.account_balance) {
        setError("Insufficient balance.")
        return
      }

      // Update sender balance
      const { error: updateSenderError } = await supabase
        .from("users")
        .update({ account_balance: senderData.account_balance - transferAmount })
        .eq("id", user.id)

      if (updateSenderError) {
        console.error("Error updating sender balance:", updateSenderError)
        setError("Failed to update sender balance.")
        return
      }

      // Update recipient balance
      const { error: updateRecipientError } = await supabase
        .from("users")
        .update({ account_balance: recipientData.account_balance + transferAmount })
        .eq("id", recipientId)

      if (updateRecipientError) {
        console.error("Error updating recipient balance:", updateRecipientError)
        // Try to rollback sender balance
        await supabase.from("users").update({ account_balance: senderData.account_balance }).eq("id", user.id)
        setError("Failed to update recipient balance. Transfer cancelled.")
        return
      }

      // Create outgoing transaction
      const { error: outgoingError } = await supabase.from("transactions").insert({
        account_no: profile.account_number,
        amount: transferAmount,
        transaction_type: "transfer_out",
        status: "completed",
        reference,
        narration: narration || "Transfer",
        recipient_account_number: recipientAccount,
        recipient_name: recipientName,
        sender_account_number: profile.account_number,
        sender_name: `${profile.first_name} ${profile.last_name}`,
      })

      if (outgoingError) {
        console.error("Error creating outgoing transaction:", outgoingError)
      }

      // Create incoming transaction for recipient
      const { error: incomingError } = await supabase.from("transactions").insert({
        account_no: recipientAccount,
        amount: transferAmount,
        transaction_type: "transfer_in",
        status: "completed",
        reference,
        narration: narration || "Transfer",
        recipient_account_number: recipientAccount,
        recipient_name: recipientName,
        sender_account_number: profile.account_number,
        sender_name: `${profile.first_name} ${profile.last_name}`,
      })

      if (incomingError) {
        console.error("Error creating incoming transaction:", incomingError)
      }

      // Create notification for sender
      await supabase.from("notifications").insert({
        account_no: profile.account_number,
        title: "Transfer Successful",
        message: `You have successfully transferred USD ${transferAmount.toFixed(2)} to ${recipientName}`,
        is_read: false,
      })

      // Create notification for recipient
      await supabase.from("notifications").insert({
        account_no: recipientAccount,
        title: "Transfer Received",
        message: `You have received USD ${transferAmount.toFixed(2)} from ${profile.first_name} ${profile.last_name}`,
        is_read: false,
      })

      // Refresh user profile to get updated balance
      await refreshUserProfile()

      setTransferSuccess(true)
      setRecipientAccount("")
      setAmount("")
      setNarration("")
      setRecipientName("")
      setRecipientId("")
    } catch (err: any) {
      console.error("Transfer error:", err)
      setError(err.message || "An error occurred while processing your transfer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Transfers & Payments</h1>

      <Tabs defaultValue="transfer">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="transfer">Transfer Money</TabsTrigger>
          <TabsTrigger value="deposit">Fund Account</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Money</CardTitle>
              <CardDescription>Send money to other accounts within the bank.</CardDescription>
            </CardHeader>
            <CardContent>
              {transferSuccess ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Transfer Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your transfer has been processed successfully.
                  </AlertDescription>
                  <Button
                    className="mt-4 bg-[#0A3D62] text-white hover:bg-[#0F5585]"
                    onClick={() => setTransferSuccess(false)}
                  >
                    Make Another Transfer
                  </Button>
                </Alert>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Account Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="recipient"
                        placeholder="Enter account number"
                        value={recipientAccount}
                        onChange={(e) => setRecipientAccount(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleVerifyAccount}
                        disabled={isLoading || !recipientAccount}
                        className="border-2 border-[#0A3D62] text-[#0A3D62] hover:bg-[#0A3D62]/10"
                      >
                        {isLoading ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>

                  {recipientName && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Recipient:</span> {recipientName}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="narration">Description (Optional)</Label>
                    <Input
                      id="narration"
                      placeholder="What's this transfer for?"
                      value={narration}
                      onChange={(e) => setNarration(e.target.value)}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-[#0A3D62] text-white hover:bg-[#0F5585]"
                      disabled={isLoading || !recipientName || !amount}
                    >
                      {isLoading ? "Processing..." : "Transfer Money"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4 text-sm text-gray-500">
              <p className="text-sm text-gray-500">Available Balance: USD {profile?.balance?.toFixed(2) || "0.00"}</p>
              <p>Daily Limit: USD 1,000,000.00</p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Fund Your Account</CardTitle>
              <CardDescription>Add money to your account using WooshPay.</CardDescription>
            </CardHeader>
            <CardContent>
              {isVerifying ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
                  <p className="mt-4 text-center">Verifying your payment...</p>
                </div>
              ) : depositSuccess ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Deposit Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your account has been credited successfully.
                  </AlertDescription>
                  <Button
                    className="mt-4 bg-[#0A3D62] text-white hover:bg-[#0F5585]"
                    onClick={() => setDepositSuccess(false)}
                  >
                    Make Another Deposit
                  </Button>
                </Alert>
              ) : (
                <>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <WooshPayPayment />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t p-4 text-sm text-gray-500">
              <p>Deposits are processed instantly via WooshPay.</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
