"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle, Wallet, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: any) => { render: (element: HTMLElement) => Promise<void> }
      FUNDING: {
        PAYPAL: string
        CARD: string
      }
    }
  }
}

export function PayPalPayment({ onSuccess, onError }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [sdkError, setSdkError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const paypalRef = useRef<HTMLDivElement>(null)
  const cardPaypalRef = useRef<HTMLDivElement>(null)
  const checkAttempts = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    // Check if PayPal is already loaded
    if (window.paypal && typeof window.paypal.Buttons === "function") {
      console.log("✅ PayPal SDK already loaded")
      setPaypalLoaded(true)
      return
    }

    // Listen for PayPal SDK load events
    const handlePayPalLoad = () => {
      console.log("✅ PayPal SDK loaded via event")
      setPaypalLoaded(true)
      setSdkError("")
    }

    const handlePayPalError = () => {
      console.error("❌ PayPal SDK failed to load via event")
      setSdkError("PayPal SDK failed to load. Please check your internet connection.")
    }

    window.addEventListener("paypal-sdk-loaded", handlePayPalLoad)
    window.addEventListener("paypal-sdk-error", handlePayPalError)

    // Start checking for PayPal SDK
    checkAttempts.current = 0
    checkPayPalSDK()

    return () => {
      window.removeEventListener("paypal-sdk-loaded", handlePayPalLoad)
      window.removeEventListener("paypal-sdk-error", handlePayPalError)
    }
  }, [retryCount])

  useEffect(() => {
    // Re-render buttons when amount changes and PayPal is loaded
    if (paypalLoaded && amount) {
      renderPayPalButtons()
    }
  }, [amount, paypalLoaded])

  const checkPayPalSDK = () => {
    checkAttempts.current += 1

    if (window.paypal && typeof window.paypal.Buttons === "function") {
      console.log("✅ PayPal SDK loaded successfully")
      setPaypalLoaded(true)
      setSdkError("")
      return
    }

    // Stop checking after 100 attempts (10 seconds)
    if (checkAttempts.current >= 100) {
      console.error("❌ PayPal SDK failed to load after 10 seconds")
      setSdkError("PayPal SDK failed to load. This might be due to network issues or ad blockers.")
      return
    }

    // Continue checking every 100ms
    setTimeout(checkPayPalSDK, 100)
  }

  const retryPayPalLoad = () => {
    if (retryCount < maxRetries) {
      setRetryCount((prev) => prev + 1)
      setSdkError("")
      setPaypalLoaded(false)
      checkAttempts.current = 0

      // Force reload the page to retry PayPal SDK loading
      window.location.reload()
    } else {
      setSdkError("Maximum retry attempts reached. Please refresh the page manually.")
    }
  }

  const renderPayPalButtons = () => {
    const paymentAmount = Number.parseFloat(amount)

    if (!paymentAmount || paymentAmount <= 0 || !window.paypal || typeof window.paypal.Buttons !== "function") {
      return
    }

    // Clear existing buttons
    if (paypalRef.current) {
      paypalRef.current.innerHTML = ""
    }
    if (cardPaypalRef.current) {
      cardPaypalRef.current.innerHTML = ""
    }

    try {
      // PayPal Account Button
      if (paypalRef.current) {
        const paypalButton = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 40,
          },
          fundingSource: window.paypal.FUNDING?.PAYPAL,
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
              setLoading(false)
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

        paypalButton.render(paypalRef.current).catch((err: any) => {
          console.error("PayPal button render error:", err)
          setError("Failed to load PayPal button")
        })
      }

      // Card Payment Button
      if (cardPaypalRef.current) {
        const cardButton = window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "white",
            shape: "rect",
            label: "pay",
            height: 40,
          },
          fundingSource: window.paypal.FUNDING?.CARD,
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
              setLoading(false)
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

        cardButton.render(cardPaypalRef.current).catch((err: any) => {
          console.error("PayPal card button render error:", err)
          setError("Failed to load card payment button")
        })
      }
    } catch (err) {
      console.error("Error rendering PayPal buttons:", err)
      setError("Failed to initialize payment buttons")
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

          {sdkError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{sdkError}</p>
                  {retryCount < maxRetries && (
                    <Button variant="outline" size="sm" onClick={retryPayPalLoad} className="w-full bg-transparent">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Loading PayPal ({retryCount + 1}/{maxRetries})
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <p>Possible solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Check your internet connection</li>
                      <li>Disable ad blockers for this site</li>
                      <li>Try refreshing the page</li>
                      <li>Use a different browser</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!paypalLoaded && !sdkError && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading PayPal payment options... ({checkAttempts.current}/100)</AlertDescription>
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
                  <div ref={paypalRef} className="w-full min-h-[50px]"></div>
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
                  <div ref={cardPaypalRef} className="w-full min-h-[50px]"></div>
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
