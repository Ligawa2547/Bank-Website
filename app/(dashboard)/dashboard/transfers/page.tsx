"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Plus,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  Shield,
  Zap,
  Globe,
} from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"
import { PayPalPayment } from "@/components/paypal-payment"
import { PayPalHostedButton } from "@/components/paypal-hosted-button"

export default function TransfersPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState("deposit")
  const [transferForm, setTransferForm] = useState({
    recipientAccount: "",
    amount: "",
    narration: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const supabase = createClientComponentClient()

  // Check for payment verification on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const reference = urlParams.get("reference")
    const status = urlParams.get("status")
    const token = urlParams.get("token")
    const payerId = urlParams.get("PayerID")

    if (reference && status === "success") {
      toast({
        title: "Payment Successful!",
        description: "Your deposit has been processed successfully.",
      })
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (token && payerId) {
      // Handle PayPal success
      handlePayPalSuccess(token, payerId)
    }
  }, [])

  const handlePayPalSuccess = async (token: string, payerId: string) => {
    try {
      const response = await fetch(`/api/paypal/success?token=${token}&PayerID=${payerId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Payment Successful!",
          description: `Your deposit has been processed successfully.`,
        })
        // Refresh user profile to update balance
        window.location.reload()
      } else {
        toast({
          title: "Payment Processing Failed",
          description: result.error || "There was an issue processing your payment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing PayPal success:", error)
      toast({
        title: "Payment Processing Error",
        description: "There was an error processing your payment. Please contact support.",
        variant: "destructive",
      })
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!transferForm.recipientAccount || !transferForm.amount || !transferForm.narration) {
      setError("Please fill in all required fields")
      return
    }

    if (!profile?.account_number) {
      setError("Your account information is not available")
      return
    }

    const amount = Number.parseFloat(transferForm.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (amount > (profile.balance || 0)) {
      setError("Insufficient balance for this transfer")
      return
    }

    if (transferForm.recipientAccount === profile.account_number) {
      setError("You cannot transfer money to your own account")
      return
    }

    setLoading(true)

    try {
      // Check if recipient account exists
      const { data: recipient, error: recipientError } = await supabase
        .from("users")
        .select("account_number, first_name, last_name, email")
        .eq("account_number", transferForm.recipientAccount)
        .single()

      if (recipientError || !recipient) {
        setError("Recipient account not found")
        setLoading(false)
        return
      }

      // Call transfer function
      const { data, error } = await supabase.rpc("transfer_funds", {
        sender_account: profile.account_number,
        recipient_account: transferForm.recipientAccount,
        transfer_amount: amount,
        transfer_narration: transferForm.narration,
      })

      if (error) {
        console.error("Transfer error:", error)
        setError(error.message || "Transfer failed")
        return
      }

      setSuccess(`Successfully transferred $${amount.toFixed(2)} to ${recipient.first_name} ${recipient.last_name}`)
      setTransferForm({
        recipientAccount: "",
        amount: "",
        narration: "",
      })

      toast({
        title: "Transfer Successful!",
        description: `$${amount.toFixed(2)} sent to ${recipient.first_name} ${recipient.last_name}`,
      })

      // Refresh page to update balance
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error("Transfer error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to access transfers</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Send Money & Add Funds</h1>
        <p className="text-gray-600">Transfer money to other accounts or add funds to your account</p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Available Balance:</strong> {formatCurrency(profile.balance || 0)}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Money
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Money
          </TabsTrigger>
        </TabsList>

        {/* Add Money Tab */}
        <TabsContent value="deposit" className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Add Money to Your Account</h2>
            <p className="text-gray-600">Choose your preferred payment method to add funds instantly</p>
          </div>

          {/* Payment Method Comparison */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PayPal Payment Options
              </CardTitle>
              <CardDescription>
                We offer two convenient PayPal payment methods for your security and convenience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2 text-blue-600">PayPal Hosted (Recommended)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Maximum Security - Processed by PayPal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span>Quick Setup - No account linking required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span>Universal - Works with any PayPal account</span>
                    </div>
                  </div>
                  <Badge className="mt-2 bg-green-100 text-green-800">Most Secure</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2 text-blue-600">PayPal Integrated</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span>PayPal Account or Card Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span>Instant Processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Secure PayPal Integration</span>
                    </div>
                  </div>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Fast & Convenient</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* PayPal Hosted */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  PayPal Hosted Payment
                </CardTitle>
                <CardDescription>Most secure option - processed entirely by PayPal's secure servers</CardDescription>
              </CardHeader>
              <CardContent>
                <PayPalHostedButton />
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <p>• Maximum security with PayPal's fraud protection</p>
                  <p>• SSL encryption and buyer protection</p>
                  <p>• No sensitive data stored on our servers</p>
                  <p>• Instant account funding after payment</p>
                </div>
              </CardContent>
            </Card>

            {/* PayPal Integrated */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  PayPal Integrated
                </CardTitle>
                <CardDescription>Pay with PayPal account or card directly on our site</CardDescription>
              </CardHeader>
              <CardContent>
                <PayPalPayment />
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card>
            <CardHeader>
              <CardTitle>How PayPal Hosted Payment Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-1">Select Amount</h3>
                  <p className="text-sm text-gray-600">Choose how much you want to deposit</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-1">PayPal Checkout</h3>
                  <p className="text-sm text-gray-600">Redirected to secure PayPal payment page</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-1">Complete Payment</h3>
                  <p className="text-sm text-gray-600">Pay with PayPal account or card</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Instant Funding</h3>
                  <p className="text-sm text-gray-600">Money added to your account immediately</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Money Tab */}
        <TabsContent value="transfer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Money
              </CardTitle>
              <CardDescription>Transfer money to another IAE Bank account instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <Label htmlFor="recipientAccount">Recipient Account Number</Label>
                  <Input
                    id="recipientAccount"
                    type="text"
                    placeholder="Enter recipient's account number"
                    value={transferForm.recipientAccount}
                    onChange={(e) => setTransferForm((prev) => ({ ...prev, recipientAccount: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    max={profile.balance || 0}
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">Available: {formatCurrency(profile.balance || 0)}</p>
                </div>

                <div>
                  <Label htmlFor="narration">Description</Label>
                  <Textarea
                    id="narration"
                    placeholder="What's this transfer for?"
                    value={transferForm.narration}
                    onChange={(e) => setTransferForm((prev) => ({ ...prev, narration: e.target.value }))}
                    required
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

                <Button type="submit" className="w-full bg-[#0A3D62] hover:bg-[#0F5585]" disabled={loading}>
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Money
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Instant transfers between IAE Bank accounts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Secure and encrypted transactions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span>No fees for internal transfers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>24/7 availability</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
