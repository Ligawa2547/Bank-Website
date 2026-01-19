"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, Search, AlertCircle, CheckCircle2, User } from "lucide-react"

interface RecipientDetails {
  account_no: string
  full_name: string
  email: string
}

export function WalletTransfer({ onTransferComplete }: { onTransferComplete?: () => void }) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  
  const [step, setStep] = useState<"search" | "confirm">("search")
  const [recipientAccountNo, setRecipientAccountNo] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [narration, setNarration] = useState("")
  
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const validateAccountNumber = async () => {
    setErrors([])
    
    // Basic validation
    if (!recipientAccountNo.trim()) {
      setErrors(["Please enter a recipient account number"])
      return
    }

    if (recipientAccountNo === profile?.account_no) {
      setErrors(["You cannot transfer to your own account"])
      return
    }

    setIsSearching(true)
    try {
      // Search for the recipient account in users table
      const { data, error } = await supabase
        .from("users")
        .select("account_no, full_name, email")
        .eq("account_no", recipientAccountNo.trim())
        .single()

      if (error || !data) {
        setErrors(["Account not found. Please check the account number and try again."])
        setRecipientDetails(null)
        return
      }

      // Account found
      setRecipientDetails({
        account_no: data.account_no,
        full_name: data.full_name || "Unknown User",
        email: data.email || "N/A",
      })
      
      toast({
        title: "Account Found",
        description: `Recipient: ${data.full_name}`,
      })
    } catch (err) {
      console.error("Error searching account:", err)
      setErrors(["An error occurred while searching for the account"])
      setRecipientDetails(null)
    } finally {
      setIsSearching(false)
    }
  }

  const handleTransfer = async () => {
    setErrors([])

    // Validation
    if (!recipientDetails) {
      setErrors(["Please search and select a recipient first"])
      return
    }

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setErrors(["Please enter a valid transfer amount"])
      return
    }

    const amount = parseFloat(transferAmount)
    const userBalance = profile?.account_balance ? parseFloat(profile.account_balance.toString()) : 0

    if (amount > userBalance) {
      setErrors(["Insufficient balance. Please check your account balance."])
      return
    }

    setIsProcessing(true)

    try {
      // Create the transfer transaction
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            sender_account_number: profile?.account_no,
            sender_name: profile?.full_name,
            recipient_account_number: recipientDetails.account_no,
            recipient_name: recipientDetails.full_name,
            amount: amount,
            transaction_type: "transfer_out",
            status: "completed",
            narration: narration || `Transfer to ${recipientDetails.full_name}`,
            reference: `TRF-${Date.now()}`,
            account_no: profile?.account_no,
            created_at: new Date().toISOString(),
          },
        ])

      if (insertError) {
        throw insertError
      }

      // Create corresponding incoming transaction for recipient
      const { error: recipientError } = await supabase
        .from("transactions")
        .insert([
          {
            sender_account_number: profile?.account_no,
            sender_name: profile?.full_name,
            recipient_account_number: recipientDetails.account_no,
            recipient_name: recipientDetails.full_name,
            amount: amount,
            transaction_type: "transfer_in",
            status: "completed",
            narration: narration || `Transfer from ${profile?.full_name}`,
            reference: `TRF-${Date.now()}`,
            account_no: recipientDetails.account_no,
            created_at: new Date().toISOString(),
          },
        ])

      if (recipientError) {
        throw recipientError
      }

      // Update sender's balance
      const newBalance = userBalance - amount
      const { error: updateError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("account_no", profile?.account_no)

      if (updateError) {
        throw updateError
      }

      // Update recipient's balance
      const { data: recipientUser } = await supabase
        .from("users")
        .select("account_balance")
        .eq("account_no", recipientDetails.account_no)
        .single()

      if (recipientUser) {
        const recipientBalance = recipientUser.account_balance ? parseFloat(recipientUser.account_balance.toString()) : 0
        const newRecipientBalance = recipientBalance + amount

        await supabase
          .from("users")
          .update({ account_balance: newRecipientBalance })
          .eq("account_no", recipientDetails.account_no)
      }

      toast({
        title: "Transfer Successful!",
        description: `$${amount.toFixed(2)} transferred to ${recipientDetails.full_name}`,
      })

      // Reset form
      setStep("search")
      setRecipientAccountNo("")
      setTransferAmount("")
      setNarration("")
      setRecipientDetails(null)

      // Call callback if provided
      onTransferComplete?.()
    } catch (err) {
      console.error("Transfer error:", err)
      setErrors(["Failed to process transfer. Please try again."])
      toast({
        title: "Transfer Failed",
        description: "An error occurred while processing your transfer",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Wallet to Wallet Transfer
        </CardTitle>
        <CardDescription>Transfer money to another user using their account number</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Search Section */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Account Number</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter recipient account number"
                  value={recipientAccountNo}
                  onChange={(e) => setRecipientAccountNo(e.target.value)}
                  disabled={isSearching}
                  className="flex-1"
                />
                <Button
                  onClick={validateAccountNumber}
                  disabled={isSearching || !recipientAccountNo.trim()}
                  className="gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Recipient Details Found */}
            {recipientDetails && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-green-900">Account Found</p>
                    <p className="text-sm text-green-700">{recipientDetails.full_name}</p>
                    <p className="text-xs text-green-600">{recipientDetails.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Details */}
            {recipientDetails && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transfer Amount ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Narration (Optional)</label>
                  <Input
                    placeholder="What is this transfer for?"
                    value={narration}
                    onChange={(e) => setNarration(e.target.value)}
                  />
                </div>

                <Button onClick={() => setStep("confirm")} className="w-full" size="lg">
                  Review Transfer
                </Button>
              </>
            )}
          </div>
        )}

        {/* Confirmation Section */}
        {step === "confirm" && recipientDetails && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <h3 className="font-semibold text-blue-900">Confirm Transfer Details</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">To:</span>
                  <span className="font-medium text-blue-900">{recipientDetails.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Account Number:</span>
                  <span className="font-medium text-blue-900">{recipientDetails.account_no}</span>
                </div>
                <div className="border-t border-blue-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-blue-700">Amount:</span>
                  <span className="font-bold text-lg text-blue-900">${parseFloat(transferAmount).toFixed(2)}</span>
                </div>
                {narration && (
                  <div>
                    <span className="text-blue-700">Note:</span>
                    <p className="text-blue-900">{narration}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("search")}
                className="flex-1"
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing
                  </>
                ) : (
                  "Confirm Transfer"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
