"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CheckCircle, XCircle, Info } from "lucide-react"
import { PayPalPayment } from "@/components/paypal-payment"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function TransfersPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle URL parameters from PayPal redirects
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const info = searchParams.get("info")
    const amount = searchParams.get("amount")

    if (success === "payment_completed") {
      toast({
        title: "Payment Successful!",
        description: amount
          ? `$${amount} has been added to your account`
          : "Your payment has been processed successfully",
      })
      // Trigger a refresh of account data
      setRefreshKey((prev) => prev + 1)
    } else if (error) {
      let errorMessage = "An error occurred during payment processing"

      switch (error) {
        case "missing_params":
          errorMessage = "Missing payment parameters"
          break
        case "auth_required":
          errorMessage = "Authentication required"
          break
        case "profile_error":
          errorMessage = "Error loading user profile"
          break
        case "balance_update":
          errorMessage = "Error updating account balance"
          break
        case "payment_not_approved":
          errorMessage = "Payment was not approved"
          break
        case "execution_failed":
          errorMessage = "Payment execution failed"
          break
        case "handler_error":
          errorMessage = "Payment handler error"
          break
        case "cancel_handler_error":
          errorMessage = "Cancel handler error"
          break
        default:
          errorMessage = error.replace(/_/g, " ")
      }

      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      })
    } else if (info === "payment_cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled",
        variant: "default",
      })
    }

    // Clean up URL parameters
    if (success || error || info) {
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      url.searchParams.delete("error")
      url.searchParams.delete("info")
      url.searchParams.delete("amount")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, toast])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    toast({
      title: "Refreshed",
      description: "Account data has been refreshed",
    })
  }

  const handlePaymentSuccess = () => {
    // Trigger a refresh when payment is successful
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfers</h1>
          <p className="text-muted-foreground">Add money to your account or transfer funds</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" key={refreshKey}>
              Loading...
            </div>
            <p className="text-xs text-muted-foreground">Available for transfers and payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Transactions</div>
            <p className="text-xs text-muted-foreground">Check your recent transfers and payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Money</CardTitle>
            <CardDescription>Choose your preferred payment method to add funds to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="paypal" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="paypal">PayPal</TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="mt-6">
                <PayPalPayment onSuccess={handlePaymentSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Payment Status Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Guide</CardTitle>
            <CardDescription>Understanding your payment statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Completed</p>
                <p className="text-sm text-muted-foreground">Payment processed successfully</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Pending</p>
                <p className="text-sm text-muted-foreground">Payment is being processed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Failed</p>
                <p className="text-sm text-muted-foreground">Payment could not be processed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Cancelled</p>
                <p className="text-sm text-muted-foreground">Payment was cancelled by user</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environment Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>PayPal Integration Active:</strong> You can now add money using PayPal or withdraw funds to your
          PayPal account. The system will automatically detect whether to use sandbox or production environment based on
          your credentials.
        </AlertDescription>
      </Alert>
    </div>
  )
}
