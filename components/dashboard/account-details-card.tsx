"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface AccountDetailsCardProps {
  accountNumber: string
  accountName: string
  balance: number
}

export function AccountDetailsCard({ accountNumber, accountName, balance }: AccountDetailsCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-gradient-to-br from-[#0A3D62] to-[#0F7AB3] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Account Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-white/70">Account Name</p>
            <p className="text-lg font-semibold">{accountName}</p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Account Number</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-white/90 hover:text-white hover:bg-white/10"
                onClick={copyToClipboard}
              >
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xl font-mono tracking-wider">{accountNumber}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Available Balance</p>
            <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
