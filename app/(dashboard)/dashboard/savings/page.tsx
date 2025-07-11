"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PiggyBank, Plus, Trash2, Lock, Unlock, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { SavingsAccount } from "@/types/user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SavingsPage() {
  const { user, profile } = useAuth()
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    initialDeposit: "",
  })
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (!user || !profile) {
      setIsLoading(false)
      return
    }

    const fetchSavingsAccounts = async () => {
      setIsLoading(true)

      try {
        // Use account_no as the identifier
        const { data, error } = await supabase
          .from("savings_accounts")
          .select("*")
          .eq("account_no", profile.account_number) // Using account_no column
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching savings accounts:", error)
        } else if (data) {
          setSavingsAccounts(data)
        }
      } catch (error) {
        console.error("Error in fetchSavingsAccounts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavingsAccounts()
  }, [user, profile, supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSavingsAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Unable to create savings account. Please try again later.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!formData.name || !formData.targetAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const targetAmount = Number.parseFloat(formData.targetAmount)
    const initialDeposit = Number.parseFloat(formData.initialDeposit || "0")

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid target amount",
        variant: "destructive",
      })
      return
    }

    if (initialDeposit > 0 && initialDeposit > profile.balance) {
      toast({
        title: "Error",
        description: "Insufficient funds for initial deposit",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Start a transaction
      const { data: newSavingsAccount, error: savingsError } = await supabase
        .from("savings_accounts")
        .insert({
          name: formData.name,
          target_amount: targetAmount,
          current_amount: initialDeposit,
          is_locked: false,
          start_date: new Date().toISOString(),
          account_no: profile.account_number, // Using account_no column
        })
        .select()
        .single()

      if (savingsError) {
        throw new Error(savingsError.message)
      }

      // If there's an initial deposit, handle the transaction
      if (initialDeposit > 0) {
        // Update user's balance
        const { error: updateError } = await supabase
          .from("users")
          .update({ account_balance: profile.balance - initialDeposit })
          .eq("id", user.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Create main transaction record
        const transactionRef = `SAV-${Date.now()}`
        await supabase.from("transactions").insert({
          account_no: profile.account_number,
          transaction_type: "withdrawal",
          amount: initialDeposit,
          status: "completed",
          reference: transactionRef,
          narration: `Initial deposit to ${formData.name} savings`,
        })

        // Create savings transaction record
        await supabase.from("savings_transactions").insert({
          savings_account_id: newSavingsAccount.id,
          account_no: profile.account_number,
          transaction_type: "deposit",
          amount: initialDeposit,
          status: "completed",
          reference: transactionRef,
          narration: `Initial deposit to ${formData.name}`,
        })
      }

      toast({
        title: "Success",
        description: "Savings account created successfully",
      })

      // Refresh savings accounts
      const { data, error } = await supabase
        .from("savings_accounts")
        .select("*")
        .eq("account_no", profile.account_number)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setSavingsAccounts(data)
      }

      // Reset form
      setFormData({
        name: "",
        targetAmount: "",
        initialDeposit: "",
      })

      // Close the dialog
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile || !selectedAccount) return

    const amount = Number.parseFloat(depositAmount)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (amount > profile.balance) {
      toast({
        title: "Error",
        description: "Insufficient funds",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Update savings account
      const newAmount = selectedAccount.current_amount + amount
      const { error: savingsError } = await supabase
        .from("savings_accounts")
        .update({ current_amount: newAmount })
        .eq("id", selectedAccount.id)

      if (savingsError) {
        throw new Error(savingsError.message)
      }

      // Update user's balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ account_balance: profile.balance - amount })
        .eq("id", user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Create main transaction record
      const transactionRef = `SAV-${Date.now()}`
      await supabase.from("transactions").insert({
        account_no: profile.account_number,
        transaction_type: "withdrawal",
        amount,
        status: "completed",
        reference: transactionRef,
        narration: `Deposit to ${selectedAccount.name} savings`,
      })

      // Create savings transaction record
      await supabase.from("savings_transactions").insert({
        savings_account_id: selectedAccount.id,
        account_no: profile.account_number,
        transaction_type: "deposit",
        amount,
        status: "completed",
        reference: transactionRef,
        narration: `Deposit to ${selectedAccount.name}`,
      })

      toast({
        title: "Success",
        description: `$${amount.toFixed(2)} deposited to ${selectedAccount.name}`,
      })

      // Refresh savings accounts
      const { data, error } = await supabase
        .from("savings_accounts")
        .select("*")
        .eq("account_no", profile.account_number)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setSavingsAccounts(data)
      }

      // Reset form
      setDepositAmount("")
      setSelectedAccount(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLock = async (account: SavingsAccount) => {
    try {
      const { error } = await supabase
        .from("savings_accounts")
        .update({ is_locked: !account.is_locked })
        .eq("id", account.id)

      if (error) {
        throw new Error(error.message)
      }

      // Refresh savings accounts
      const { data, error: fetchError } = await supabase
        .from("savings_accounts")
        .select("*")
        .eq("account_no", profile?.account_number)
        .order("created_at", { ascending: false })

      if (!fetchError && data) {
        setSavingsAccounts(data)
      }

      toast({
        title: "Success",
        description: `Savings account ${account.is_locked ? "unlocked" : "locked"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSavingsAccount = async (account: SavingsAccount) => {
    if (!user || !profile) return

    try {
      // If there's money in the account, return it to the main balance
      if (account.current_amount > 0) {
        // Update user's balance
        const { error: updateError } = await supabase
          .from("users")
          .update({ account_balance: profile.balance + account.current_amount })
          .eq("id", user.id)

        if (updateError) {
          throw new Error(updateError.message)
        }

        // Create main transaction record
        const transactionRef = `SAV-${Date.now()}`
        await supabase.from("transactions").insert({
          account_no: profile.account_number,
          transaction_type: "deposit",
          amount: account.current_amount,
          status: "completed",
          reference: transactionRef,
          narration: `Withdrawal from ${account.name} savings (account closed)`,
        })

        // Create savings transaction record
        await supabase.from("savings_transactions").insert({
          savings_account_id: account.id,
          account_no: profile.account_number,
          transaction_type: "withdrawal",
          amount: account.current_amount,
          status: "completed",
          reference: transactionRef,
          narration: `Account closure withdrawal from ${account.name}`,
        })
      }

      // Delete savings account
      const { error } = await supabase.from("savings_accounts").delete().eq("id", account.id)

      if (error) {
        throw new Error(error.message)
      }

      // Refresh savings accounts
      const { data, error: fetchError } = await supabase
        .from("savings_accounts")
        .select("*")
        .eq("account_no", profile.account_number)
        .order("created_at", { ascending: false })

      if (!fetchError && data) {
        setSavingsAccounts(data)
      }

      toast({
        title: "Success",
        description: "Savings account deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A3D62] border-t-transparent"></div>
          <span className="text-lg text-gray-600">Loading savings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-gray-600 mt-1">Build your future with smart savings goals</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">
            Total Saved:{" "}
            <span className="font-semibold text-green-600">
              {formatCurrency(savingsAccounts.reduce((sum, account) => sum + account.current_amount, 0))}
            </span>
          </span>
        </div>
      </div>

      {profile && profile.kyc_status !== "approved" && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Limited Savings Features</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Some savings features may be limited until your identity is verified.
                  {profile.kyc_status === "not_submitted"
                    ? " Please complete your KYC verification."
                    : " Your verification is pending review."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Create New Savings Goal Card */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#0A3D62] hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
              <CardContent className="flex flex-col items-center justify-center h-full py-12">
                <div className="rounded-full bg-gradient-to-r from-[#0A3D62] to-[#0F5585] p-4 mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Goal</h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Set up a new savings goal and start building your financial future
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-[#0A3D62]" />
                Create New Savings Goal
              </DialogTitle>
              <DialogDescription>Set a target amount and start saving towards your goal.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSavingsAccount}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Vacation, New Car, Emergency Fund"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <Input
                      id="targetAmount"
                      name="targetAmount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialDeposit">Initial Deposit (Optional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <Input
                      id="initialDeposit"
                      name="initialDeposit"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.initialDeposit}
                      onChange={handleInputChange}
                    />
                  </div>
                  {profile && (
                    <p className="text-xs text-gray-500">Available balance: {formatCurrency(profile.balance)}</p>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0A3D62] hover:bg-[#0F5585] w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating...
                    </div>
                  ) : (
                    "Create Goal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Savings Goals Cards */}
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A3D62] border-t-transparent"></div>
              <span>Loading your savings goals...</span>
            </div>
          </div>
        ) : savingsAccounts.length > 0 ? (
          savingsAccounts.map((account) => (
            <Card
              key={account.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{account.name}</CardTitle>
                    <CardDescription className="text-sm">
                      Target: {formatCurrency(account.target_amount)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white/50"
                      onClick={() => handleToggleLock(account)}
                      title={account.is_locked ? "Unlock" : "Lock"}
                    >
                      {account.is_locked ? (
                        <Lock className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-600" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this savings goal?
                            {account.current_amount > 0 && (
                              <span className="block mt-2 font-medium text-green-600">
                                The current balance of {formatCurrency(account.current_amount)} will be returned to your
                                main account.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteSavingsAccount(account)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {formatCurrency(account.current_amount)} of {formatCurrency(account.target_amount)}
                    </span>
                  </div>
                  <Progress
                    value={(account.current_amount / account.target_amount) * 100}
                    className="h-3 bg-gray-200"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {Math.round((account.current_amount / account.target_amount) * 100)}% complete
                    </div>
                    {account.current_amount >= account.target_amount && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        🎉 Goal Reached!
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full bg-[#0A3D62] hover:bg-[#0F5585] transition-colors"
                      disabled={account.is_locked}
                    >
                      {account.is_locked ? "Account Locked" : "Add Money"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-[#0A3D62]" />
                        Add Money to {account.name}
                      </DialogTitle>
                      <DialogDescription>Add funds to your savings goal.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDeposit}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="depositAmount">Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <Input
                              id="depositAmount"
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7"
                              value={depositAmount}
                              onChange={(e) => {
                                setDepositAmount(e.target.value)
                                setSelectedAccount(account)
                              }}
                              required
                            />
                          </div>
                          {profile && (
                            <p className="text-xs text-gray-500">
                              Available balance: {formatCurrency(profile.balance)}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current Progress</span>
                            <span className="font-medium">
                              {formatCurrency(account.current_amount)} of {formatCurrency(account.target_amount)}
                            </span>
                          </div>
                          <Progress value={(account.current_amount / account.target_amount) * 100} className="h-2" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-[#0A3D62] hover:bg-[#0F5585]" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Processing...
                            </div>
                          ) : (
                            "Add Money"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 p-6 mb-6">
              <PiggyBank className="h-16 w-16 text-[#0A3D62]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Savings Goals Yet</h3>
            <p className="text-gray-500 max-w-md leading-relaxed">
              Start building your financial future by creating your first savings goal. Set targets and watch your money
              grow!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
