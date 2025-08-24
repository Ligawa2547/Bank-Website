"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, DollarSign, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess: () => void
}

export function PayPalPayment({ onSuccess }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handlePayPalPayment = async (paymentMethod: "paypal" | "card") => {
    if (!amount || Number.parseFloat(amount) < 1) {
      setError("Please enter an amount of at least $1.00")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          type: "deposit",
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      if (data.approvalUrl) {
        // Show loading message
        toast({
          title: "Redirecting to PayPal",
          description: "You will be redirected to PayPal to complete your payment",
        })

        // Small delay to show the toast, then redirect
        setTimeout(() => {
          window.location.href = data.approvalUrl
        }, 1000)
      } else {
        throw new Error("No approval URL received")
      }
    } catch (error) {
      console.error("PayPal payment error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (!amount || Number.parseFloat(amount) < 1) {
      setError("Please enter an amount of at least $1.00")
      return
    }

    if (!paypalEmail) {
      setError("Please enter your PayPal email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          type: "withdrawal",
          paypalEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal")
      }

      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal has been processed and will arrive within 1-3 business days.",
      })

      setAmount("")
      setPaypalEmail("")
      onSuccess()
    } catch (error) {
      console.error("PayPal withdrawal error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      toast({
        title: "Withdrawal Error",
        description: error instanceof Error ? error.message : "Failed to process withdrawal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (value: string) => {
    const num = Number.parseFloat(value)
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          PayPal Payments
        </CardTitle>
        <CardDescription>Add money to your account or withdraw funds via PayPal</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Add Money</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              {amount && (
                <p className="text-sm text-gray-600">
                  You will deposit: <span className="font-semibold">{formatAmount(amount)}</span>
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => handlePayPalPayment("paypal")}
                disabled={loading || !amount}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                Pay with PayPal
              </Button>

              <Button
                onClick={() => handlePayPalPayment("card")}
                disabled={loading || !amount}
                variant="outline"
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay with Card
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Secure payments powered by PayPal. Card payments don't require a PayPal account.
            </p>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="withdraw-amount"
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
                placeholder="your-email@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>

            {amount && paypalEmail && (
              <p className="text-sm text-gray-600">
                You will receive: <span className="font-semibold">{formatAmount(amount)}</span> at{" "}
                <span className="font-semibold">{paypalEmail}</span>
              </p>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleWithdrawal} disabled={loading || !amount || !paypalEmail} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Withdraw to PayPal
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Withdrawals typically arrive within 1-3 business days. PayPal fees may apply.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
