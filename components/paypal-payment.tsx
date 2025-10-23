"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, CheckCircle, Wallet } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    paypal?: any
  }
}

export function PayPalPayment({ onSuccess, onError }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const paypalRef = useRef<HTMLDivElement>(null)
  const cardPaypalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if PayPal SDK is loaded
    const checkPayPal = () => {
      if (window.paypal) {
        setPaypalLoaded(true)
        renderPayPalButtons()
      } else {
        setTimeout(checkPayPal, 100)
      }
    }
    checkPayPal()
  }, [amount])

  const renderPayPalButtons = () => {
    const paymentAmount = Number.parseFloat(amount)

    if (!paymentAmount || paymentAmount <= 0 || !window.paypal) {
      return
    }

    // Clear existing buttons
    if (paypalRef.current) {
      paypalRef.current.innerHTML = ""
    }
    if (cardPaypalRef.current) {
      cardPaypalRef.current.innerHTML = ""
    }

    // PayPal Account Button
    if (paypalRef.current) {
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 40,
          },
          fundingSource: window.paypal.FUNDING.PAYPAL,
          createOrder: async (data: any, actions: any) => {
            try {
              setLoading(true)
              setError("")

              const response = await fetch("/api/paypal/initialize", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: paymentAmount,
                  paymentMethod: "paypal",
                }),
              })

              const orderData = await response.json()

              if (!response.ok) {
                throw new Error(orderData.error || "Payment initialization failed")
              }

              return orderData.orderId
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Payment failed"
              setError(errorMessage)
              onError?.(errorMessage)
              throw err
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await fetch(`/api/paypal/success?token=${data.orderID}&PayerID=${data.payerID}`)
              const result = await response.json()

              if (response.ok && result.success) {
                toast({
                  title: "Payment Successful!",
                  description: `$${paymentAmount} has been added to your account`,
                })
                onSuccess?.()
                setAmount("")
              } else {
                throw new Error(result.error || "Payment processing failed")
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Payment processing failed"
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
          },
          onError: (err: any) => {
            console.error("PayPal error:", err)
            setError("PayPal payment failed")
            onError?.("PayPal payment failed")
            setLoading(false)
          },
          onCancel: (data: any) => {
            toast({
              title: "Payment Cancelled",
              description: "Your PayPal payment was cancelled",
            })
            setLoading(false)
          },
        })
        .render(paypalRef.current)
    }

    // Card Payment Button
    if (cardPaypalRef.current) {
      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "white",
            shape: "rect",
            label: "pay",
            height: 40,
          },
          fundingSource: window.paypal.FUNDING.CARD,
          createOrder: async (data: any, actions: any) => {
            try {
              setLoading(true)
              setError("")

              const response = await fetch("/api/paypal/initialize", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: paymentAmount,
                  paymentMethod: "card",
                }),
              })

              const orderData = await response.json()

              if (!response.ok) {
                throw new Error(orderData.error || "Payment initialization failed")
              }

              return orderData.orderId
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Payment failed"
              setError(errorMessage)
              onError?.(errorMessage)
              throw err
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await fetch(`/api/paypal/success?token=${data.orderID}&PayerID=${data.payerID}`)
              const result = await response.json()

              if (response.ok && result.success) {
                toast({
                  title: "Payment Successful!",
                  description: `$${paymentAmount} has been added to your account`,
                })
                onSuccess?.()
                setAmount("")
              } else {
                throw new Error(result.error || "Payment processing failed")
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Payment processing failed"
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
          },
          onError: (err: any) => {
            console.error("PayPal Card error:", err)
            setError("Card payment failed")
            onError?.("Card payment failed")
            setLoading(false)
          },
          onCancel: (data: any) => {
            toast({
              title: "Payment Cancelled",
              description: "Your card payment was cancelled",
            })
            setLoading(false)
          },
        })
        .render(cardPaypalRef.current)
    }
  }

  const formatCurrency = (value: string) => {
    const num = Number.parseFloat(value)
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
  }

  const isValidAmount = () => {
    const paymentAmount = Number.parseFloat(amount)
    return paymentAmount && paymentAmount >= 1 && paymentAmount <= 10000
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          Add Money
        </CardTitle>
        <CardDescription>Choose your preferred payment method to add funds</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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

          {!paypalLoaded && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading PayPal payment options...</AlertDescription>
            </Alert>
          )}

          {paypalLoaded && (
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paypal">PayPal Account</TabsTrigger>
                <TabsTrigger value="card">Debit/Credit Card</TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="space-y-3 mt-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Pay using your PayPal account balance</p>
                  <p>• Link your bank account or card to PayPal</p>
                  <p>• Secure PayPal login required</p>
                </div>

                {isValidAmount() ? (
                  <div ref={paypalRef} className="w-full"></div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-muted-foreground">
                    Enter an amount between $1.00 and $10,000.00 to see PayPal button
                  </div>
                )}
              </TabsContent>

              <TabsContent value="card" className="space-y-3 mt-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Pay directly with your debit or credit card</p>
                  <p>• No PayPal account required</p>
                  <p>• Processed securely through PayPal</p>
                </div>

                {isValidAmount() ? (
                  <div ref={cardPaypalRef} className="w-full"></div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-muted-foreground">
                    Enter an amount between $1.00 and $10,000.00 to see card payment button
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>• Minimum deposit: $1.00</p>
            <p>• Maximum deposit: $10,000.00</p>
            <p>• Funds available immediately after payment</p>
            <p>• All payments processed securely</p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Secure payment powered by PayPal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
