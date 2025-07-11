"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"

interface WooshPayPaymentProps {
  amount: number
  onSuccess?: (reference: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

export function WooshPayPayment({ amount, onSuccess, onError, onClose }: WooshPayPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [publicKey, setPublicKey] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  })

  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await fetch("/api/wooshpay/public-key")
        const data = await response.json()
        if (data.success && data.publicKey) {
          setPublicKey(data.publicKey)
        }
      } catch (err) {
        console.error("Failed to fetch public key:", err)
      }
    }

    fetchPublicKey()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const reference = `woosh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Initialize payment
      const initResponse = await fetch("/api/wooshpay/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100,
          email: "user@example.com",
          reference,
          ...cardDetails,
        }),
      })

      const initData = await initResponse.json()

      if (!initResponse.ok) {
        throw new Error(initData.error || "Payment initialization failed")
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Verify payment
      const verifyResponse = await fetch("/api/wooshpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Payment verification failed")
      }

      if (verifyData.success && verifyData.data.status === "success") {
        onSuccess?.(reference)
      } else {
        throw new Error("Payment was not successful")
      }
    } catch (err: any) {
      const errorMessage = err.message || "Payment failed"
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          WooshPay Payment
        </CardTitle>
        <CardDescription>Pay ${amount.toLocaleString()} securely with WooshPay</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePayment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              name="cardholderName"
              value={cardDetails.cardholderName}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              name="cardNumber"
              value={cardDetails.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="expiryMonth">Month</Label>
              <Input
                id="expiryMonth"
                name="expiryMonth"
                value={cardDetails.expiryMonth}
                onChange={handleInputChange}
                placeholder="MM"
                maxLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryYear">Year</Label>
              <Input
                id="expiryYear"
                name="expiryYear"
                value={cardDetails.expiryYear}
                onChange={handleInputChange}
                placeholder="YY"
                maxLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay $${amount.toLocaleString()}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
