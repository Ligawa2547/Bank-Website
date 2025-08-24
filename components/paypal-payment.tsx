"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PayPalPaymentProps {
  type: "deposit" | "withdrawal"
  onSuccess?: () => void
}

export function PayPalPayment({ type, onSuccess }: PayPalPaymentProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("paypal")

  const { toast } = useToast()

  const handlePayment = async (method: string = paymentMethod) => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
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
          type,
          description: description || `PayPal ${type}`,
          paymentMethod: method,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `${type} initialization failed`)
      }

      if (type === "deposit" && data.approvalUrl) {
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl
      } else if (type === "withdrawal" && data.success) {
        // Withdrawal completed immediately
        toast({
          title: "Withdrawal Successful",
          description: `$${amount} has been sent to your PayPal account.`,
        })

        setAmount("")
        setDescription("")

        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setError(error.message)
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isDeposit = type === "deposit"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          {isDeposit ? (
            <>
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              Add Money
            </>
          ) : (
            <>
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
              Withdraw Money
            </>
          )}
        </CardTitle>
        <CardDescription className="text-sm">
          {isDeposit ? "Add money to your account using PayPal or card" : "Withdraw money to your PayPal account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {isDeposit && (
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paypal" className="text-xs sm:text-sm">
                PayPal
              </TabsTrigger>
              <TabsTrigger value="card" className="text-xs sm:text-sm">
                Credit Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paypal" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">Pay securely with your PayPal account</p>
              </div>
            </TabsContent>

            <TabsContent value="card" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">Pay with credit or debit card via PayPal</p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${type}-amount`} className="text-sm">
            Amount (USD)
          </Label>
          <Input
            id={`${type}-amount`}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            disabled={loading}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-description`} className="text-sm">
            Description (Optional)
          </Label>
          <Textarea
            id={`${type}-description`}
            placeholder={`Enter ${type} description...`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        <Button
          onClick={() => handlePayment(paymentMethod)}
          disabled={loading || !amount || Number.parseFloat(amount) <= 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === "card" ? <CreditCard className="mr-2 h-4 w-4" /> : <Wallet className="mr-2 h-4 w-4" />}
              {isDeposit ? `${paymentMethod === "card" ? "Pay with Card" : "Pay with PayPal"}` : "Withdraw to PayPal"}
            </>
          )}
        </Button>

        <div className="text-center text-xs sm:text-sm text-muted-foreground">
          {isDeposit ? (
            <p>
              {paymentMethod === "card"
                ? "You will be redirected to PayPal to enter your card details securely"
                : "You will be redirected to PayPal to complete your deposit"}
            </p>
          ) : (
            <p>Funds will be sent to your PayPal account email</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PayPalPayment
