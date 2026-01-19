"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowDownLeft, RefreshCw, CheckCircle, XCircle, Info, DollarSign, Eye, EyeOff } from "lucide-react"
import { CardPayment } from "@/components/card-payment"
import { WalletTransfer } from "@/components/wallet-transfer"
import { XprizoM2mDeposit } from "@/components/xprizo-mpesa-deposit"
import { XprizoWalletTransfer } from "@/components/xprizo-wallet-transfer"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useSupabase } from "@/providers/supabase-provider"

export default function TransfersPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [accountBalance, setAccountBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { supabase, user } = useSupabase()

  useEffect(() => {
    if (user) {
      fetchAccountBalance()
    }
  }, [user, refreshKey])

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
        case "missing_payment_params":
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

  const fetchAccountBalance = async () => {
    if (!user) return

    try {
      setIsLoadingBalance(true)

      // Fetch user profile and balance from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_balance, first_name, last_name, account_no")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        toast({
          title: "Error",
          description: "Failed to load account balance",
          variant: "destructive",
        })
        return
      }

      if (userData) {
        setAccountBalance(userData.account_balance || 0)
        setUserProfile(userData)
      }
    } catch (error) {
      console.error("Error fetching account balance:", error)
      toast({
        title: "Error",
        description: "Failed to load account information",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBalance(false)
    }
  }

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
    toast({
      title: "Payment Successful",
      description: "Your account balance has been updated",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfers</h1>
          <p className="text-muted-foreground">Add money to your account using secure card payments</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingBalance ? (
                <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
              ) : showBalance ? (
                formatCurrency(accountBalance)
              ) : (
                "••••••"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for transfers and payments
              {userProfile?.account_no && <span className="block mt-1">Account: {userProfile.account_no}</span>}
            </p>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Information</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-medium">
                {userProfile?.first_name} {userProfile?.last_name}
              </div>
              <p className="text-sm text-muted-foreground">Account Number: {userProfile?.account_no || "Loading..."}</p>
              <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="grid gap-6">
        {/* Wallet to Wallet Transfer */}
        <WalletTransfer onTransferComplete={handleRefresh} />

        {/* Xprizo M-Pesa Deposit */}
        <XprizoM2mDeposit 
          merchantWalletId={process.env.NEXT_PUBLIC_XPRIZO_MERCHANT_ID || ""}
          onSuccess={handleRefresh}
        />

        {/* Xprizo Wallet Transfer */}
        <XprizoWalletTransfer onSuccess={handleRefresh} />

        <Card>
          <CardHeader>
            <CardTitle>Add Money to Your Account</CardTitle>
            <CardDescription>
              Add funds securely using your debit or credit card. Payments are processed instantly through IntaSend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardPayment onSuccess={handlePaymentSuccess} />
          </CardContent>
        </Card>

        {/* Payment Methods Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Understanding your payment options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Debit/Credit Card</p>
                <p className="text-sm text-muted-foreground">
                  Pay directly with your card. All card details are encrypted and processed securely through IntaSend.
                </p>
              </div>
            </div>
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
                <p className="text-sm text-muted-foreground">Payment processed successfully and balance updated</p>
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
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Secure Payments:</strong> All card payments are processed securely through IntaSend with SSL
          encryption. Your card details are never stored on our servers.
        </AlertDescription>
      </Alert>
    </div>
  )
}
