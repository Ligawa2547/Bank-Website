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
import { AlertCircle } from "lucide-react"

interface WooshPayPaymentProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function WooshPayPayment({ onSuccess, onCancel }: WooshPayPaymentProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const { session } = useSession()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDebugInfo("")

    console.log("Starting payment process...")

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
      console.log("Fetching user data...")

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (userError || !userData) {
        console.error("User data error:", userError)
        setError("User data not found. Please try again.")
        setDebugInfo(`User error: ${userError?.message}`)
        setIsLoading(false)
        return
      }

      console.log("User data found:", userData.account_no)

      // Generate a unique reference
      const reference = `dep_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
      console.log("Generated reference:", reference)

      // Create a pending transaction in the database
      const transactionData = {
        account_no: userData.account_no,
        amount: Number(amount),
        transaction_type: "deposit",
        status: "pending",
        reference,
        narration: "Deposit via WooshPay",
        recipient_account_number: userData.account_no,
        recipient_name: `${userData.first_name} ${userData.last_name}`,
        created_at: new Date().toISOString(),
      }

      console.log("Creating transaction:", transactionData)

      const { error: transactionError } = await supabase.from("transactions").insert(transactionData)

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        setError("Failed to initiate payment. Please try again.")
        setDebugInfo(`Transaction error: ${transactionError.message}`)
        setIsLoading(false)
        return
      }

      console.log("Transaction created successfully")

      // Initialize WooshPay payment
      const paymentData = {
        email: session.user.email,
        amount: Number(amount),
        reference,
        metadata: {
          account_number: userData.account_no,
          user_id: session.user.id,
        },
      }

      console.log("Initializing WooshPay payment:", paymentData)

      const response = await fetch("/api/wooshpay/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      console.log("API response status:", response.status)

      const responseText = await response.text()
      console.log("API response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        setError("Invalid response from server")
        setDebugInfo(`Parse error: ${parseError}`)
        setIsLoading(false)
        return
      }

      console.log("Parsed response data:", data)

      if (!response.ok) {
        setError(data.message || "Failed to initialize payment")
        setDebugInfo(`API error: ${response.status} - ${JSON.stringify(data)}`)
        setIsLoading(false)
        return
      }

      if (!data.authorization_url) {
        setError("No payment URL received from gateway")
        setDebugInfo(`Missing authorization_url in response: ${JSON.stringify(data)}`)
        setIsLoading(false)
        return
      }

      console.log("Redirecting to:", data.authorization_url)

      // Redirect to WooshPay checkout
      window.location.href = data.authorization_url
    } catch (error: any) {
      console.error("Payment error:", error)
      setError("An error occurred while processing your payment. Please try again.")
      setDebugInfo(`Catch error: ${error.message}`)
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
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugInfo && process.env.NODE_ENV === "development" && (
          <Alert>
            <AlertDescription>
              <strong>Debug Info:</strong> {debugInfo}
            </AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full bg-[#0A3D62] text-white hover:bg-[#0F5585]" disabled={isLoading}>
          {isLoading ? "Processing..." : "Pay with WooshPay"}
        </Button>
      </form>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h4 className="font-semibold mb-2">Debug Information:</h4>
          <p>
            <strong>Session:</strong> {session?.user?.email || "No session"}
          </p>
          <p>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </p>
          <p>
            <strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL}
          </p>
        </div>
      )}
    </div>
  )
}
