"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/providers/session-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

interface WooshPayPaymentProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function WooshPayPayment({ onSuccess, onCancel }: WooshPayPaymentProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { session } = useSession()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

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
        setError(data.message || "Failed to initialize payment")
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
          <Button type="submit" className="flex-1 bg-[#0A3D62] text-white hover:bg-[#0F5585]" disabled={isLoading}>
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
