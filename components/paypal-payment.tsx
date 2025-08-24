"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayPalPaymentProps {
  onSuccess?: () => void
}

export function PayPalPayment({ onSuccess }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handlePayment = async (type: "deposit" | "withdrawal", paymentMethod: "paypal" | "card" = "paypal") => {
    if (!amount || Number.parseFloat(amount) < 1) {
      setError("Amount must be at least $1.00")
      return
    }

    if (type === "withdrawal" && !paypalEmail) {
      setError("PayPal email is required for withdrawals")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("Initiating PayPal payment:", { amount, type, paymentMethod, paypalEmail })

      const response = await fetch("/api/paypal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          type,
          paymentMethod,
          paypalEmail: type === "withdrawal" ? paypalEmail : undefined,
        }),
      })

      const data = await response.json()
      console.log("PayPal initialize response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      if (data.success) {
        if (type === "deposit" && data.approvalUrl) {
          // Redirect to PayPal for approval
          console.log("Redirecting to PayPal:", data.approvalUrl)
          window.location.href = data.approvalUrl
        } else if (type === "withdrawal") {
          // Withdrawal completed
          toast({
            title: "Withdrawal Successful",
            description: `$${amount} has been sent to ${paypalEmail}`,
          })
          setAmount("")
          setPaypalEmail("")
          onSuccess?.()
        }
      } else {
        throw new Error(data.error || "Payment failed")
      }
    } catch (error) {
      console.error("PayPal payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Payment failed"
      setError(errorMessage)

      toast({
        title: "Payment Error",
        description: errorMessage,
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
          <DollarSign className="h-5 w-5" />
          PayPal Payment
        </CardTitle>
        <CardDescription>Add money to your account or withdraw funds using PayPal</CardDescription>
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
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button onClick={() => handlePayment("deposit", "paypal")} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Pay with PayPal
                  </>
                )}
              </Button>

              <Button
                onClick={() => handlePayment("deposit", "card")}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay with Card
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="withdrawal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount (USD)</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="Enter PayPal email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={() => handlePayment("withdrawal")} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Withdraw to PayPal
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
