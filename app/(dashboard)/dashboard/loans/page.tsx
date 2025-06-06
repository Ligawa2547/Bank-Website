"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import type { LoanType, LoanApplication, LoanEligibility } from "@/types/loan"

export default function LoansPage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [loanTypes, setLoanTypes] = useState<LoanType[]>([])
  const [myLoans, setMyLoans] = useState<LoanApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType | null>(null)
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null)

  // Application form state
  const [requestedAmount, setRequestedAmount] = useState("")
  const [purpose, setPurpose] = useState("")
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState("")
  const [existingLoans, setExistingLoans] = useState("")

  useEffect(() => {
    if (user) {
      fetchLoanData()
    }
  }, [user])

  const fetchLoanData = async () => {
    setIsLoading(true)
    try {
      // Fetch available loan types
      const { data: loanTypesData, error: loanTypesError } = await supabase
        .from("loan_types")
        .select("*")
        .eq("is_active", true)
        .order("min_amount", { ascending: true })

      if (loanTypesError) {
        console.error("Error fetching loan types:", loanTypesError)
      } else {
        setLoanTypes(loanTypesData || [])
      }

      // Fetch user's loan applications
      const { data: myLoansData, error: myLoansError } = await supabase
        .from("loan_applications")
        .select(`
          *,
          loan_types (
            name,
            interest_rate,
            term_months
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (myLoansError) {
        console.error("Error fetching user loans:", myLoansError)
      } else {
        setMyLoans(myLoansData || [])
      }
    } catch (error) {
      console.error("Error fetching loan data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkEligibility = async (loanType: LoanType) => {
    if (!profile) return

    // Simple eligibility logic - can be enhanced
    const accountAge = new Date().getTime() - new Date(profile.created_at).getTime()
    const accountAgeMonths = accountAge / (1000 * 60 * 60 * 24 * 30)

    const hasActiveLoans = myLoans.some((loan) => loan.status === "approved" || loan.status === "disbursed")

    let eligible = true
    let maxAmount = loanType.max_amount
    const reasons: string[] = []

    // Check account age (minimum 1 month)
    if (accountAgeMonths < 1) {
      eligible = false
      reasons.push("Account must be at least 1 month old")
    }

    // Check if user has too many active loans
    if (
      hasActiveLoans &&
      myLoans.filter((loan) => loan.status === "approved" || loan.status === "disbursed").length >= 2
    ) {
      eligible = false
      reasons.push("Maximum of 2 active loans allowed")
    }

    // Check account balance (should have some transaction history)
    if (profile.balance < 10) {
      maxAmount = Math.min(maxAmount, 1000)
      reasons.push("Limited loan amount due to low account activity")
    }

    // Adjust max amount based on account balance and activity
    if (profile.balance > 1000) {
      maxAmount = Math.min(maxAmount, profile.balance * 5)
    } else {
      maxAmount = Math.min(maxAmount, 500)
    }

    if (eligible && reasons.length === 0) {
      reasons.push("You meet all requirements for this loan")
    }

    setEligibility({
      eligible,
      max_amount: maxAmount,
      reasons,
      income_requirement: loanType.min_amount * 2,
    })
  }

  const handleLoanApplication = async () => {
    if (!selectedLoanType || !profile) return

    setIsApplying(true)
    try {
      const amount = Number.parseFloat(requestedAmount)
      const income = Number.parseFloat(monthlyIncome)

      // Validate application
      if (amount < selectedLoanType.min_amount || amount > selectedLoanType.max_amount) {
        toast({
          title: "Invalid Amount",
          description: `Loan amount must be between $${selectedLoanType.min_amount} and $${selectedLoanType.max_amount}`,
          variant: "destructive",
        })
        return
      }

      if (eligibility && amount > eligibility.max_amount) {
        toast({
          title: "Amount Exceeds Limit",
          description: `Based on your profile, maximum loan amount is $${eligibility.max_amount}`,
          variant: "destructive",
        })
        return
      }

      // Create loan application
      const { data: applicationData, error: applicationError } = await supabase
        .from("loan_applications")
        .insert({
          user_id: user?.id,
          loan_type_id: selectedLoanType.id,
          requested_amount: amount,
          purpose,
          employment_status: employmentStatus,
          monthly_income: income,
          existing_loans: existingLoans === "yes",
          status: "pending",
          application_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (applicationError) {
        throw applicationError
      }

      // Auto-approve based on simple criteria
      let approvalStatus = "pending"
      const approvedAmount = amount

      // Simple auto-approval logic
      if (income >= amount * 2 && amount <= 5000 && !existingLoans) {
        approvalStatus = "approved"

        // Update application status
        await supabase
          .from("loan_applications")
          .update({
            status: "approved",
            approved_amount: approvedAmount,
            approval_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationData.id)

        // Disburse loan immediately for demo purposes
        await disburseLoan(applicationData.id, approvedAmount)
      }

      toast({
        title: "Application Submitted",
        description:
          approvalStatus === "approved"
            ? `Loan approved and disbursed! $${approvedAmount} has been added to your account.`
            : "Your loan application is under review. You'll be notified of the decision.",
        variant: approvalStatus === "approved" ? "default" : "default",
      })

      // Reset form and close dialog
      setRequestedAmount("")
      setPurpose("")
      setEmploymentStatus("")
      setMonthlyIncome("")
      setExistingLoans("")
      setSelectedLoanType(null)

      // Refresh data
      await fetchLoanData()
      if (approvalStatus === "approved") {
        await refreshUserProfile()
      }
    } catch (error: any) {
      console.error("Error submitting loan application:", error)
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit loan application",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const disburseLoan = async (applicationId: string, amount: number) => {
    try {
      // Add money to user's account
      const { error: balanceError } = await supabase
        .from("users")
        .update({
          account_balance: (profile?.balance || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id)

      if (balanceError) {
        throw balanceError
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("transactions").insert({
        account_no: profile?.account_number,
        transaction_type: "loan_disbursement",
        amount: amount,
        status: "completed",
        reference: `LOAN-${applicationId.slice(-8)}`,
        narration: "Loan disbursement",
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError)
      }

      // Update loan application status
      await supabase
        .from("loan_applications")
        .update({
          status: "disbursed",
          disbursement_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
    } catch (error) {
      console.error("Error disbursing loan:", error)
      throw error
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "disbursed":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "disbursed":
      case "completed":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Loans</h1>
          <p className="text-gray-600">Apply for loans and manage your borrowing</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
          <TrendingUp className="h-5 w-5 text-[#0A3D62]" />
          <div>
            <p className="text-sm font-medium">Credit Score</p>
            <p className="text-xs text-gray-500">Good (750+)</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Available Loans</TabsTrigger>
          <TabsTrigger value="my-loans">My Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loanTypes.map((loanType) => (
              <Card key={loanType.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#0A3D62]" />
                    {loanType.name}
                  </CardTitle>
                  <CardDescription>{loanType.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amount Range</p>
                      <p className="font-medium">
                        {formatCurrency(loanType.min_amount)} - {formatCurrency(loanType.max_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p className="font-medium">{loanType.interest_rate}% APR</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Term</p>
                      <p className="font-medium">{loanType.term_months} months</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Processing</p>
                      <p className="font-medium">Instant</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Requirements:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {loanType.requirements.map((req, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-[#0A3D62]"
                        onClick={() => {
                          setSelectedLoanType(loanType)
                          checkEligibility(loanType)
                        }}
                      >
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Apply for {selectedLoanType?.name}</DialogTitle>
                        <DialogDescription>Complete the application form below</DialogDescription>
                      </DialogHeader>

                      {eligibility && (
                        <div
                          className={`p-3 rounded-md ${eligibility.eligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                        >
                          <p className={`font-medium ${eligibility.eligible ? "text-green-800" : "text-red-800"}`}>
                            {eligibility.eligible ? "Eligible for Loan" : "Not Eligible"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Maximum Amount: {formatCurrency(eligibility.max_amount)}
                          </p>
                          <ul className="text-xs mt-2 space-y-1">
                            {eligibility.reasons.map((reason, index) => (
                              <li key={index} className="flex items-center gap-1">
                                {eligibility.eligible ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Requested Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={requestedAmount}
                            onChange={(e) => setRequestedAmount(e.target.value)}
                            min={selectedLoanType?.min_amount}
                            max={eligibility?.max_amount || selectedLoanType?.max_amount}
                          />
                        </div>

                        <div>
                          <Label htmlFor="purpose">Loan Purpose</Label>
                          <Textarea
                            id="purpose"
                            placeholder="What will you use this loan for?"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="employment">Employment Status</Label>
                          <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self-employed">Self-Employed</SelectItem>
                              <SelectItem value="unemployed">Unemployed</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="retired">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="income">Monthly Income</Label>
                          <Input
                            id="income"
                            type="number"
                            placeholder="Enter monthly income"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="existing-loans">Do you have existing loans?</Label>
                          <Select value={existingLoans} onValueChange={setExistingLoans}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          onClick={handleLoanApplication}
                          disabled={
                            isApplying ||
                            !eligibility?.eligible ||
                            !requestedAmount ||
                            !purpose ||
                            !employmentStatus ||
                            !monthlyIncome ||
                            !existingLoans
                          }
                          className="w-full bg-[#0A3D62]"
                        >
                          {isApplying ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-loans" className="space-y-6">
          {myLoans.length > 0 ? (
            <div className="space-y-4">
              {myLoans.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(loan.status)}
                        {loan.loan_types?.name || "Personal Loan"}
                      </CardTitle>
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>Applied on {new Date(loan.application_date).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Requested Amount</p>
                        <p className="font-medium">{formatCurrency(loan.requested_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Approved Amount</p>
                        <p className="font-medium">
                          {loan.approved_amount ? formatCurrency(loan.approved_amount) : "Pending"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-medium">{loan.loan_types?.interest_rate || 0}% APR</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Term</p>
                        <p className="font-medium">{loan.loan_types?.term_months || 0} months</p>
                      </div>
                    </div>

                    {loan.purpose && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Purpose</p>
                        <p className="text-sm">{loan.purpose}</p>
                      </div>
                    )}

                    {loan.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                        <p className="text-sm text-red-600">{loan.rejection_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No loan applications yet</p>
                <p className="text-sm text-gray-400">Apply for your first loan to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
