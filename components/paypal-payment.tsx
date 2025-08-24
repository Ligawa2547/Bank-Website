"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  type: "deposit" | "withdrawal"
  onSuccess?: () => void
}

export function PayPalPayment({ type, onSuccess }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handlePayment = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Initiating PayPal payment:", { amount: Number.parseFloat(amount), type, description })

      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          type,
          description: description || (type === "deposit" ? "Account deposit" : "Account withdrawal"),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      if (type === "deposit" && data.approvalUrl) {
        // Redirect to PayPal for approval
        console.log("Redirecting to PayPal:", data.approvalUrl)
        window.location.href = data.approvalUrl
      } else if (type === "withdrawal") {
        // Withdrawal completed immediately
        toast({
          title: "Withdrawal Initiated",
          description: `$${amount} has been sent to your PayPal account.`,
        })

        setAmount("")
        setDescription("")
        onSuccess?.()
      }
    } catch (error: any) {
      console.error("Payment error:", error.message)
      setError(error.message)
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isDeposit = type === "deposit"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDeposit ? (
            <>
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              PayPal Deposit
            </>
          ) : (
            <>
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
              PayPal Withdrawal
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isDeposit ? "Add money to your account using PayPal" : "Withdraw money to your PayPal account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder={`Enter description for this ${type}...`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>

        <Button onClick={handlePayment} disabled={loading || !amount} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {isDeposit ? "Deposit with PayPal" : "Withdraw to PayPal"}
            </>
          )}
        </Button>

        {isDeposit && (
          <p className="text-sm text-muted-foreground text-center">
            You will be redirected to PayPal to complete your deposit
          </p>
        )}

        {!isDeposit && (
          <p className="text-sm text-muted-foreground text-center">Funds will be sent to your PayPal account email</p>
        )}
      </CardContent>
    </Card>
  )
}
