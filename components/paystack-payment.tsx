"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PaystackPaymentProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PaystackPayment({ onSuccess, onCancel }: PaystackPaymentProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (!user || !profile) {
      alert("You must be logged in to make a deposit")
      return
    }

    setIsLoading(true)

    try {
      // Generate a unique reference
      const reference = `dep_${Date.now()}_${Math.floor(Math.random() * 1000000)}`

      // Create a pending transaction in the database
      const { error: transactionError } = await supabase.from("transactions").insert({
        account_no: profile.account_number,
        amount: Number(amount),
        transaction_type: "deposit",
        status: "pending",
        reference,
        narration: "Deposit via Paystack",
        recipient_account_number: profile.account_number,
        recipient_name: `${profile.first_name} ${profile.last_name}`,
      })

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        alert("Failed to initiate payment. Please try again.")
        setIsLoading(false)
        return
      }

      // Redirect to Paystack checkout
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transfers?reference=${reference}`

      // Initialize Paystack
      // @ts-ignore
      const handler = window.PaystackPop?.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: Number(amount) * 100, // Paystack expects amount in kobo (or cents)
        currency: "USD",
        ref: reference,
        callback: () => {
          // This is called after the payment is complete
          if (onSuccess) onSuccess()
          router.push(`/dashboard/transfers?reference=${reference}&status=success`)
        },
        onClose: () => {
          if (onCancel) onCancel()
        },
        metadata: {
          account_number: profile.account_number,
          user_id: user.id,
        },
      })

      handler.openIframe()
    } catch (error) {
      console.error("Payment error:", error)
      alert("An error occurred while processing your payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div>
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="100"
          step="100"
          required
        />
      </div>
      <Button type="submit" className="w-full bg-[#0A3D62]" disabled={isLoading}>
        {isLoading ? "Processing..." : "Pay with Paystack"}
      </Button>
    </form>
  )
}
