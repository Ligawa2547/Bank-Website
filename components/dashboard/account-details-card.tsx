"use client"

import { useState } from "react"
import { Copy, CheckCircle } from "lucide-react"
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

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-[#0A3D62] to-[#0F5585] p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white text-lg font-medium">Available Balance</h3>
            <p className="text-3xl font-bold text-white mt-2">{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <CardDescription className="text-sm text-gray-500 mb-1">Account Name</CardDescription>
            <CardTitle className="text-base">{accountName}</CardTitle>
          </div>

          <div>
            <CardDescription className="text-sm text-gray-500 mb-1">Account Number</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-mono">{accountNumber}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAccountNumber}
                className="border-2 border-[#0A3D62] text-[#0A3D62] hover:bg-[#0A3D62]/10"
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
