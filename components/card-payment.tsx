"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/providers/supabase-provider"

interface CardPaymentProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function CardPayment({ onSuccess, onError }: CardPaymentProps) {
  const [amount, setAmount] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const { user } = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to process payment")
      return
    }

    const paymentAmount = Number.parseFloat(amount)
    if (!paymentAmount || paymentAmount < 1 || paymentAmount > 10000) {
      setError("Amount must be between $1.00 and $10,000.00")
      return
    }

    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      setError("Please fill in all card details")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/intasend/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: paymentAmount,
          cardNumber: cardNumber.replace(/\s/g, ""),
          cardHolder,
          expiryMonth,
          expiryYear,
          cvv,
          narration: `Card deposit of $${paymentAmount}`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Payment initialization failed")
      }

      const verifyResponse = await fetch("/api/intasend/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: result.transactionId,
        }),
      })

      const verifyResult = await verifyResponse.json()

      if (verifyResponse.ok && verifyResult.success) {
        toast({
          title: "Payment Successful!",
          description: `$${paymentAmount} has been added to your account`,
        })

        // Clear form
        setAmount("")
        setCardHolder("")
        setCardNumber("")
        setExpiryMonth("")
        setExpiryYear("")
        setCvv("")

        onSuccess?.()
      } else {
        throw new Error(verifyResult.error || "Payment verification failed")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed"
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

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          Card Payment
        </CardTitle>
        <CardDescription>Enter your card details securely</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardHolder">Card Holder Name</Label>
            <Input
              id="cardHolder"
              placeholder="John Doe"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={formatCardNumber(cardNumber)}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
              maxLength="16"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                maxLength="2"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                placeholder="YY"
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                maxLength="2"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                maxLength="4"
                type="password"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pay ${amount || "0.00"}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
            <Lock className="h-4 w-4" />
            <span>Secure payment powered by IntaSend</span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
