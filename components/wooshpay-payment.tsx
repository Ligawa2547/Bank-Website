"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/providers/session-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

interface WooshPayPaymentProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function WooshPayPayment({ onSuccess, onCancel }: WooshPayPaymentProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isServiceAvailable, setIsServiceAvailable] = useState(true)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const { session } = useSession()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check service availability on component mount
  useEffect(() => {
    const checkServiceAvailability = async () => {
      try {
        const response = await fetch("/api/wooshpay/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            amount: 1,
            reference: "test_availability_check",
          }),
        })

        if (response.status === 503) {
          const data = await response.json()
          if (data.error === "WOOSHPAY_NOT_CONFIGURED") {
            setIsServiceAvailable(false)
            setError("Payment service is currently unavailable. Please contact support.")
          }
        }
      } catch (error) {
        console.log("Service availability check failed, assuming available")
      }
    }

    checkServiceAvailability()
  }, [])

  // Fetch the public key at runtime (no env vars in the bundle)
  useEffect(() => {
    fetch("/api/wooshpay/public-key")
      .then((res) => res.json())
      .then(({ publicKey }) => setPublicKey(publicKey))
      .catch((err) => console.error("Failed to load WooshPay key", err))
  }, [])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!isServiceAvailable) {
      setError("Payment service is currently unavailable. Please contact support.")
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (!session?.user) {
      setError("You must be logged in to make a deposit")
      return
    }

    setIsLoading(true)

    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (userError || !userData) {
        setError("User data not found. Please try again.")
        setIsLoading(false)
        return
      }

      // Generate a unique reference
      const reference = `dep_${Date.now()}_${Math.floor(Math.random() * 1000000)}`

      // Initialize payment through API (server-side)
      const response = await fetch("/api/wooshpay/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          amount: Number(amount),
          reference,
          metadata: {
            account_number: userData.account_no,
            user_id: session.user.id,
            user_name: `${userData.first_name} ${userData.last_name}`,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          setError("Payment service is temporarily unavailable. Please try again later.")
          setIsServiceAvailable(false)
        } else {
          setError(data.message || "Failed to initialize payment")
        }
        setIsLoading(false)
        return
      }

      if (!data.authorization_url) {
        setError("No payment URL received from gateway")
        setIsLoading(false)
        return
      }

      // Store payment reference for verification
      localStorage.setItem("wooshpay_reference", reference)
      localStorage.setItem("wooshpay_amount", amount)

      // Redirect to WooshPay checkout
      window.location.href = data.authorization_url
    } catch (error: any) {
      console.error("Payment error:", error)
      setError("An error occurred while processing your payment. Please try again.")
      setIsLoading(false)
    }
  }

  if (!isServiceAvailable) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Payment service is currently unavailable. Please contact support for assistance with deposits.
          </AlertDescription>
        </Alert>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="w-full bg-transparent">
            Close
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
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
            className="text-lg"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 bg-[#0A3D62] text-white hover:bg-[#0F5585]"
            disabled={isLoading || !publicKey}
            aria-busy={isLoading}
          >
            {isLoading ? "Processing..." : "Pay with WooshPay"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="text-sm text-gray-600 space-y-1">
        <p>• Secure payment processing</p>
        <p>• Instant account funding</p>
        <p>• 24/7 transaction support</p>
      </div>
    </div>
  )
}
