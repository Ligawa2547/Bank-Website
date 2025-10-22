"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CreditCard, RefreshCw } from "lucide-react"

interface PayPalPaymentProps {
  amount: number
  onSuccess?: (details: any) => void
  onError?: (error: any) => void
}

declare global {
  interface Window {
    paypal?: any
  }
}

export function PayPalPayment({ amount, onSuccess, onError }: PayPalPaymentProps) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [checkAttempts, setCheckAttempts] = useState(0)
  const buttonRendered = useRef(false)
  const maxCheckAttempts = 10

  useEffect(() => {
    const handleSDKLoad = () => {
      console.log("PayPal SDK load event received")
      setSdkReady(true)
      setError(null)
    }

    const handleSDKError = () => {
      console.error("PayPal SDK error event received")
      setError("Failed to load PayPal SDK. Please check your internet connection and try again.")
      setSdkReady(false)
    }

    window.addEventListener("paypal-sdk-loaded", handleSDKLoad)
    window.addEventListener("paypal-sdk-error", handleSDKError)

    // Check if SDK is already loaded
    checkPayPalSDK()

    return () => {
      window.removeEventListener("paypal-sdk-loaded", handleSDKLoad)
      window.removeEventListener("paypal-sdk-error", handleSDKError)
    }
  }, [])

  useEffect(() => {
    if (sdkReady && !buttonRendered.current && paypalRef.current && amount > 0) {
      renderPayPalButtons()
    }
  }, [sdkReady, amount])

  const checkPayPalSDK = () => {
    if (checkAttempts >= maxCheckAttempts) {
      setError("PayPal SDK is taking too long to load. Please refresh the page or check your internet connection.")
      return
    }

    if (window.paypal && typeof window.paypal.Buttons === "function") {
      console.log("PayPal SDK is ready")
      setSdkReady(true)
      setError(null)
    } else {
      console.log(`Checking for PayPal SDK... Attempt ${checkAttempts + 1}/${maxCheckAttempts}`)
      setCheckAttempts((prev) => prev + 1)
      setTimeout(checkPayPalSDK, 500)
    }
  }

  const renderPayPalButtons = () => {
    if (!window.paypal || typeof window.paypal.Buttons !== "function") {
      console.error("PayPal SDK not properly loaded")
      setError("PayPal is not available. Please refresh the page and try again.")
      return
    }

    if (buttonRendered.current) {
      console.log("PayPal buttons already rendered, skipping")
      return
    }

    if (!paypalRef.current) {
      console.error("PayPal container ref is null")
      return
    }

    try {
      // Clear the container
      paypalRef.current.innerHTML = ""

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          },
          createOrder: async (data: any, actions: any) => {
            try {
              const response = await fetch("/api/paypal/initialize", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to create PayPal order")
              }

              const order = await response.json()
              return order.id
            } catch (error) {
              console.error("Error creating order:", error)
              setError(error instanceof Error ? error.message : "Failed to create order")
              throw error
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await fetch("/api/paypal/success", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderID: data.orderID }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Payment verification failed")
              }

              const details = await response.json()
              onSuccess?.(details)
            } catch (error) {
              console.error("Error approving order:", error)
              const errorMessage = error instanceof Error ? error.message : "Payment verification failed"
              setError(errorMessage)
              onError?.(error)
            }
          },
          onError: (err: any) => {
            console.error("PayPal button error:", err)
            setError("An error occurred with PayPal. Please try again.")
            onError?.(err)
          },
          onCancel: (data: any) => {
            console.log("PayPal payment cancelled:", data)
            setError("Payment was cancelled. Please try again if you wish to complete the payment.")
          },
        })
        .render(paypalRef.current)
        .then(() => {
          console.log("PayPal buttons rendered successfully")
          buttonRendered.current = true
        })
        .catch((err: any) => {
          console.error("Error rendering PayPal buttons:", err)
          setError("Failed to render PayPal buttons. Please refresh the page and try again.")
        })
    } catch (err) {
      console.error("Error in renderPayPalButtons:", err)
      setError("Failed to initialize PayPal. Please refresh the page and try again.")
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)
    setError(null)
    setCheckAttempts(0)
    buttonRendered.current = false
    setSdkReady(false)

    // Clear the container
    if (paypalRef.current) {
      paypalRef.current.innerHTML = ""
    }

    // Retry checking for SDK
    setTimeout(() => {
      checkPayPalSDK()
      setIsRetrying(false)
    }, 1000)
  }

  if (amount <= 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please enter a valid amount to continue with PayPal.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!sdkReady && !error && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-gray-600">Loading PayPal...</p>
          </div>
        </div>
      )}

      <div ref={paypalRef} className={sdkReady ? "block" : "hidden"} />

      {sdkReady && (
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>You will be redirected to PayPal to complete your payment securely</p>
          <p className="flex items-center justify-center gap-1">
            <CreditCard className="h-3 w-3" />
            Secure payment powered by PayPal
          </p>
        </div>
      )}
    </div>
  )
}
