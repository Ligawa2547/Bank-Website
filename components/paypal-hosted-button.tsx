"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, CreditCard, CheckCircle } from "lucide-react"

const PREDEFINED_AMOUNTS = [10, 25, 50, 100, 250, 500]

export function PayPalHostedButton() {
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState("")
  const [useCustomAmount, setUseCustomAmount] = useState(false)

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setUseCustomAmount(false)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setUseCustomAmount(true)
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue)
    }
  }

  const finalAmount = useCustomAmount && customAmount ? Number.parseFloat(customAmount) : selectedAmount

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          PayPal Hosted Payment
        </CardTitle>
        <CardDescription>Secure payment processing by PayPal with maximum protection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Select Amount</Label>

          {/* Predefined Amounts */}
          <div className="grid grid-cols-3 gap-2">
            {PREDEFINED_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount && !useCustomAmount ? "default" : "outline"}
                size="sm"
                onClick={() => handleAmountSelect(amount)}
                className="text-sm"
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount" className="text-sm">
              Or enter custom amount
            </Label>
            <Input
              id="custom-amount"
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              min="1"
              step="0.01"
            />
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security Features
          </h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              SSL Encryption
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              Buyer Protection
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              Fraud Protection
            </div>
          </div>
        </div>

        {/* PayPal Hosted Button */}
        <div className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              Amount: ${finalAmount.toFixed(2)}
            </Badge>
          </div>

          {/* PayPal Hosted Form */}
          <div className="text-center">
            <style jsx>{`
              .pp-LD6RAEF4HGXYL {
                text-align: center;
                border: none;
                border-radius: 0.25rem;
                min-width: 11.625rem;
                padding: 0 2rem;
                height: 2.625rem;
                font-weight: bold;
                background-color: #FFD140;
                color: #000000;
                font-family: "Helvetica Neue", Arial, sans-serif;
                font-size: 1rem;
                line-height: 1.25rem;
                cursor: pointer;
                transition: all 0.2s ease;
                width: 100%;
              }
              .pp-LD6RAEF4HGXYL:hover {
                background-color: #F5C842;
                transform: translateY(-1px);
              }
            `}</style>

            <form
              action="https://www.paypal.com/ncp/payment/LD6RAEF4HGXYL"
              method="post"
              target="_blank"
              style={{
                display: "inline-grid",
                justifyItems: "center",
                alignContent: "start",
                gap: "0.5rem",
                width: "100%",
              }}
            >
              <input className="pp-LD6RAEF4HGXYL" type="submit" value={`Pay $${finalAmount.toFixed(2)}`} />
              <img
                src="https://www.paypalobjects.com/images/Debit_Credit.svg"
                alt="Accepted payment methods"
                style={{ height: "24px" }}
              />
              <section style={{ fontSize: "0.75rem", color: "#666" }}>
                Powered by{" "}
                <img
                  src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                  alt="PayPal"
                  style={{ height: "0.875rem", verticalAlign: "middle" }}
                />
              </section>
            </form>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">Accepted Payment Methods</p>
          <div className="flex justify-center items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">PayPal • Visa • Mastercard • American Express • Discover</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Click the PayPal button above</li>
            <li>Complete payment on PayPal's secure site</li>
            <li>Your account will be credited automatically</li>
            <li>You'll receive an email confirmation</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
