"use client"

import { useState } from "react"
import { Copy, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface AccountDetailsCardProps {
  accountNumber: string
  accountName: string
  balance: number
  currency?: string
}

export function AccountDetailsCard({ accountNumber, accountName, balance, currency = "USD" }: AccountDetailsCardProps) {
  const [copied, setCopied] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const { toast } = useToast()

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)

    toast({
      title: "Account number copied",
      description: "The account number has been copied to your clipboard.",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance)
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-white text-base sm:text-lg font-medium">Available Balance</h3>
            <div className="flex items-center space-x-3 mt-2">
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {showBalance ? formatCurrency(balance) : "••••••"}
              </p>
              <button
                onClick={toggleBalanceVisibility}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff className="h-5 w-5 text-white" /> : <Eye className="h-5 w-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <CardDescription className="text-xs sm:text-sm text-gray-500 mb-1">Account Name</CardDescription>
            <CardTitle className="text-sm sm:text-base">{accountName}</CardTitle>
          </div>

          <div>
            <CardDescription className="text-xs sm:text-sm text-gray-500 mb-1">Account Number</CardDescription>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-mono">{accountNumber}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAccountNumber}
                className="border-2 border-[#0A3D62] text-[#0A3D62] hover:bg-[#0A3D62]/10 w-full sm:w-auto"
                aria-label="Copy account number"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
