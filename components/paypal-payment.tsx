"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Wallet, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess?: () => void
}

export function PayPalPayment({ onSuccess }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handlePayPalPayment = async (type: "deposit" | "withdrawal", paymentMethod: "paypal" | "card") => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(amount) < 1) {
      setError("Minimum amount is $1.00")
      return
    }

    if (type === "withdrawal" && !email) {
      setError("Please enter your PayPal email for withdrawal")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("Initiating PayPal payment:", { amount, type, paymentMethod, email })

      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          type,
          paymentMethod,
          email: type === "withdrawal" ? email : undefined,
        }),
      })

      const data = await response.json()
      console.log("PayPal initialize response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      if (type === "deposit" && data.approvalUrl) {
        // Redirect to PayPal for payment
        console.log("Redirecting to PayPal:", data.approvalUrl)
        window.location.href = data.approvalUrl
      } else if (type === "withdrawal" && data.success) {
        toast({
          title: "Withdrawal Initiated",
          description: "Your withdrawal has been processed and will arrive within 1-3 business days.",
        })
        setAmount("")
        setEmail("")
        onSuccess?.()
      }
    } catch (error: any) {
      console.error("PayPal payment error:", error)
      setError(error.message || "Payment failed. Please try again.")
      toast({
        title: "Payment Error",
        description: error.message || "Payment failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          PayPal Payments
        </CardTitle>
        <CardDescription>Deposit or withdraw funds using PayPal</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="1"
                  step="0.01"
                />
              </div>
              <p className="text-sm text-muted-foreground">Minimum: $1.00</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => handlePayPalPayment("deposit", "paypal")}
                disabled={isLoading}
                className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                Pay with PayPal
              </Button>

              <Button
                onClick={() => handlePayPalPayment("deposit", "card")}
                disabled={isLoading}
                variant="outline"
                className="w-full border-[#0070ba] text-[#0070ba] hover:bg-[#0070ba] hover:text-white"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Pay with Card
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Card payments are processed securely through PayPal. No PayPal account required.
            </p>
          </TabsContent>

          <TabsContent value="withdrawal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withdrawal-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">Funds will be sent to this PayPal email address</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handlePayPalPayment("withdrawal", "paypal")}
              disabled={isLoading}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
              Withdraw to PayPal
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Withdrawals typically arrive within 1-3 business days
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
