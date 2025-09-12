"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/hooks/use-profile"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, DollarSign, Loader2 } from "lucide-react"

interface KYCSubmission {
  id: string
  user_id: string
  account_no: string
  document_type: string
  document_number: string
  document_front_url: string | null
  document_back_url: string | null
  selfie_url: string | null
  status: "pending" | "approved" | "rejected"
  reviewer_notes: string | null
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

const documentTypes = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "bank_statement", label: "Bank Statement" },
]

const KYC_FEE = 35

export default function KYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const { profile, deductBalance, refreshProfile } = useProfile()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching KYC submissions:", error)
      toast({
        title: "Error",
        description: "Failed to load KYC submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from("kyc-documents").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("kyc-documents").getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) {
      toast({
        title: "Error",
        description: "Profile not loaded",
        variant: "destructive",
      })
      return
    }

    if (!documentType || !documentNumber || !frontFile || !selfieFile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Check if user has sufficient balance for KYC fee
    if (profile.balance < KYC_FEE) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least $${KYC_FEE} to submit KYC documents. Please add funds to your account.`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No authenticated user")

      const timestamp = Date.now()
      const userId = user.id

      // Upload files
      const frontUrl = await uploadFile(frontFile, `${userId}/documents/${timestamp}_front_${frontFile.name}`)

      let backUrl = null
      if (backFile) {
        backUrl = await uploadFile(backFile, `${userId}/documents/${timestamp}_back_${backFile.name}`)
      }

      const selfieUrl = await uploadFile(selfieFile, `${userId}/selfies/${timestamp}_selfie_${selfieFile.name}`)

      // Deduct KYC fee from user balance
      const balanceDeducted = await deductBalance(KYC_FEE)
      if (!balanceDeducted) {
        throw new Error("Failed to deduct KYC fee")
      }

      // Create KYC submission
      const { error: insertError } = await supabase.from("kyc_submissions").insert({
        user_id: userId,
        account_no: profile.account_no,
        document_type: documentType,
        document_number: documentNumber,
        document_front_url: frontUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl,
        status: "pending",
      })

      if (insertError) {
        throw insertError
      }

      // Record the KYC fee transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        account_no: profile.account_no,
        type: "debit",
        amount: KYC_FEE,
        description: "KYC Verification Fee",
        status: "completed",
        reference: `KYC_FEE_${timestamp}`,
        balance_after: profile.balance - KYC_FEE,
      })

      toast({
        title: "Success",
        description: `KYC documents submitted successfully! $${KYC_FEE} fee has been deducted from your account.`,
      })

      // Reset form
      setDocumentType("")
      setDocumentNumber("")
      setFrontFile(null)
      setBackFile(null)
      setSelfieFile(null)

      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>
      fileInputs.forEach((input) => {
        input.value = ""
      })

      // Refresh data
      await Promise.all([fetchSubmissions(), refreshProfile()])
    } catch (error) {
      console.error("Error submitting KYC:", error)
      toast({
        title: "Error",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getProgressValue = () => {
    if (!profile) return 0

    switch (profile.kyc_status) {
      case "not_submitted":
        return 0
      case "pending":
        return 50
      case "approved":
        return 100
      case "rejected":
        return 25
      default:
        return 0
    }
  }

  const canSubmitKYC = () => {
    return !profile?.kyc_status || profile.kyc_status === "not_submitted" || profile.kyc_status === "rejected"
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your identity verification to unlock all features</p>
        </div>
      </div>

      {/* KYC Fee Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center space-x-3 p-4">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">KYC Processing Fee: ${KYC_FEE}</p>
            <p className="text-sm text-blue-700">This fee will be deducted from your account balance upon submission</p>
            {profile && <p className="text-sm text-blue-600">Current Balance: ${profile.balance.toFixed(2)}</p>}
          </div>
        </CardContent>
      </Card>

      {/* KYC Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verification Status
          </CardTitle>
          <CardDescription>Track your KYC verification progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{getProgressValue()}%</span>
          </div>
          <Progress value={getProgressValue()} className="w-full" />

          {profile && (
            <div className="flex items-center gap-2">
              {getStatusIcon(profile.kyc_status)}
              <span className="text-sm">Status: {getStatusBadge(profile.kyc_status)}</span>
            </div>
          )}

          {profile?.kyc_status === "rejected" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your KYC submission was rejected. Please submit new documents with the correct information.
              </AlertDescription>
            </Alert>
          )}

          {profile?.kyc_status === "approved" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your KYC verification has been approved! You now have access to all banking features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* KYC Submission Form */}
      {canSubmitKYC() && (
        <Card>
          <CardHeader>
            <CardTitle>Submit KYC Documents</CardTitle>
            <CardDescription>Upload your identity documents for verification. Fee: ${KYC_FEE}</CardDescription>
          </CardHeader>
          <CardContent>
            {profile && profile.balance < KYC_FEE && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient balance. You need at least ${KYC_FEE} to submit KYC documents. Current balance: $
                  {profile.balance.toFixed(2)}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-number">Document Number *</Label>
                  <Input
                    id="document-number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter document number"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="front-file">Document Front *</Label>
                  <Input
                    id="front-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Upload front side of document</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="back-file">Document Back</Label>
                  <Input
                    id="back-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Optional for single-sided documents</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selfie-file">Selfie Photo *</Label>
                  <Input
                    id="selfie-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Clear photo holding document</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Guidelines:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Ensure all documents are clear and readable</li>
                  <li>• Documents must be valid and not expired</li>
                  <li>• Selfie must clearly show your face and the document</li>
                  <li>• Processing typically takes 1-3 business days</li>
                  <li>• A ${KYC_FEE} processing fee will be charged</li>
                </ul>
              </div>

              <Button type="submit" disabled={submitting || (profile && profile.balance < KYC_FEE)} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Documents...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit KYC Documents (${KYC_FEE})
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Previous Submissions */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>View your previous KYC submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <span className="font-medium">
                        {documentTypes.find((t) => t.value === submission.document_type)?.label}
                      </span>
                      {getStatusBadge(submission.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">Document Number: {submission.document_number}</p>

                  {submission.reviewer_notes && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Reviewer Notes:</strong> {submission.reviewer_notes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {submission.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Reviewed on: {new Date(submission.reviewed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
