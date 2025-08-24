"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function PayPalPayment({ onSuccess, onError }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePayment = async () => {
    const paymentAmount = Number.parseFloat(amount)

    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (paymentAmount < 1) {
      setError("Minimum deposit amount is $1.00")
      return
    }

    if (paymentAmount > 10000) {
      setError("Maximum deposit amount is $10,000.00")
      return
    }

    try {
      setLoading(true)
      setError("")

      console.log(`🚀 Initiating PayPal payment for $${paymentAmount}`)

      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: paymentAmount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      console.log("✅ PayPal payment initialized:", data.orderId)

      // Redirect to PayPal for payment
      if (data.approvalUrl) {
        toast({
          title: "Redirecting to PayPal",
          description: "You will be redirected to complete your payment",
        })

        // Redirect to PayPal
        window.location.href = data.approvalUrl
      } else {
        throw new Error("PayPal approval URL not received")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed"
      console.error("❌ PayPal payment error:", errorMessage)
      setError(errorMessage)
      onError?.(errorMessage)

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    const num = Number.parseFloat(value)
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          PayPal Payment
        </CardTitle>
        <CardDescription>Add money to your account using PayPal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max="10000"
            step="0.01"
            disabled={loading}
          />
          {amount && <p className="text-sm text-muted-foreground">You will deposit: {formatCurrency(amount)}</p>}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handlePayment}
            disabled={loading || !amount}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with PayPal
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Minimum deposit: $1.00</p>
            <p>• Maximum deposit: $10,000.00</p>
            <p>• Funds will be available immediately after payment</p>
            <p>• You can pay with your PayPal account or card</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Secure payment powered by PayPal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
