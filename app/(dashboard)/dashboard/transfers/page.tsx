"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { PaystackPayment } from "@/components/paystack-payment"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TransfersPage() {
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [accounts, setAccounts] = useState<any[]>([])
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    // Fetch user balance
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", session.user.id).single()

    if (profile) {
      setBalance(profile.balance || 0)
    }

    // Fetch other accounts for transfers
    const { data: allAccounts } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, account_number")
      .neq("id", session.user.id)

    if (allAccounts) {
      setAccounts(allAccounts)
    }
  }

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const recipientId = formData.get("recipient") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const description = formData.get("description") as string

    if (amount > balance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    // Call the transfer function
    const { data, error } = await supabase.rpc("transfer_funds", {
      sender_id: session.user.id,
      recipient_id: recipientId,
      amount: amount,
      description: description,
    })

    if (error) {
      toast({
        title: "Error",
        description: "Transfer failed",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Transfer completed successfully",
      })
      fetchAccountData() // Refresh balance
      ;(e.target as HTMLFormElement).reset()
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Transfers & Deposits</h1>
          <p className="text-muted-foreground">Send money and add funds to your account</p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">₦{balance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transfer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer">Send Money</TabsTrigger>
            <TabsTrigger value="deposit">Add Funds</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer">
            <Card>
              <CardHeader>
                <CardTitle>Send Money</CardTitle>
                <CardDescription>Transfer money to another account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select name="recipient" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.first_name} {account.last_name} - {account.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input id="amount" name="amount" type="number" min="1" max={balance} step="0.01" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input id="description" name="description" placeholder="What's this for?" />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Processing..." : "Send Money"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
                <CardDescription>Deposit money into your account using Paystack</CardDescription>
              </CardHeader>
              <CardContent>
                <PaystackPayment onSuccess={fetchAccountData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
