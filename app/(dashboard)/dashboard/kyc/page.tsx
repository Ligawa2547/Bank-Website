"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProfile } from "@/hooks/use-profile"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, DollarSign } from "lucide-react"

const KYC_FEE = 35.0

export default function KYCPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { profile, loading, deductBalance, refreshProfile } = useProfile()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a valid file type (JPEG, PNG, or PDF)")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      setSelectedFile(file)
      setError(null)
    }
  }

  const uploadFile = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from("kyc-documents").upload(fileName, file)

    if (error) {
      throw error
    }

    return data.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!profile) {
      setError("Profile not loaded")
      return
    }

    if (!documentType || !documentNumber || !selectedFile) {
      setError("Please fill in all fields and select a file")
      return
    }

    if (profile.kyc_status === "pending") {
      setError("You already have a pending KYC submission")
      return
    }

    if (profile.kyc_status === "approved") {
      setError("Your KYC is already approved")
      return
    }

    setIsSubmitting(true)

    try {
      // Check and deduct balance first
      const balanceDeducted = await deductBalance(KYC_FEE, "KYC Verification Fee")
      if (!balanceDeducted) {
        return // Error already shown by deductBalance
      }

      // Upload file
      const filePath = await uploadFile(selectedFile, profile.id)

      // Get file URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("kyc-documents").getPublicUrl(filePath)

      // Create KYC submission
      const { error: submissionError } = await supabase.from("kyc_submissions").insert({
        user_id: profile.id,
        account_no: profile.account_no,
        document_type: documentType,
        document_number: documentNumber,
        document_url: publicUrl,
        status: "pending",
        fee_paid: KYC_FEE,
        submitted_at: new Date().toISOString(),
      })

      if (submissionError) {
        throw submissionError
      }

      // Update user KYC status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          kyc_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error("Error updating user status:", updateError)
      }

      toast({
        title: "KYC Submitted Successfully!",
        description: `Your KYC documents have been submitted for review. Fee of $${KYC_FEE} has been deducted.`,
      })

      // Reset form
      setDocumentType("")
      setDocumentNumber("")
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh profile to get updated status
      await refreshProfile()
    } catch (err: any) {
      console.error("KYC submission error:", err)
      setError(err.message || "Failed to submit KYC documents")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile data</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Verification</h1>
        <p className="text-gray-600 mt-2">Complete your identity verification to unlock all banking features</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(profile.kyc_status)}
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className={getStatusColor(profile.kyc_status)}>
              {profile.kyc_status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{getProgressValue(profile.kyc_status)}%</span>
            </div>
            <Progress value={getProgressValue(profile.kyc_status)} className="h-2" />
          </div>

          {profile.kyc_status === "rejected" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Your KYC submission was rejected. Please submit new documents with correct information.
              </AlertDescription>
            </Alert>
          )}

          {profile.kyc_status === "approved" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your identity has been verified successfully! You now have access to all banking features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Balance Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium">Current Balance:</span>
            </div>
            <span className="text-2xl font-bold text-green-600">${profile.account_balance.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">KYC verification fee: ${KYC_FEE.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Submission Form */}
      {(profile.kyc_status === "not_submitted" || profile.kyc_status === "rejected") && (
        <Card>
          <CardHeader>
            <CardTitle>Submit KYC Documents</CardTitle>
            <CardDescription>
              Upload your identity documents for verification. A fee of ${KYC_FEE} will be charged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="utility_bill">Utility Bill</SelectItem>
                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Document Number</Label>
                <Input
                  id="documentNumber"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Enter document number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      {selectedFile.name}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Select a JPEG, PNG, or PDF file (max 5MB)</p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Important:</p>
                    <ul className="mt-1 text-yellow-700 space-y-1">
                      <li>• Ensure document is clear and readable</li>
                      <li>• Document must be valid and not expired</li>
                      <li>• A fee of ${KYC_FEE} will be deducted from your balance</li>
                      <li>• Processing typically takes 1-3 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || profile.account_balance < KYC_FEE}>
                {isSubmitting
                  ? "Submitting..."
                  : profile.account_balance < KYC_FEE
                    ? `Insufficient Balance (Need $${KYC_FEE})`
                    : `Submit KYC Documents ($${KYC_FEE})`}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {profile.kyc_status === "pending" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Under Review</h3>
                <p className="text-gray-600">
                  Your KYC documents are being reviewed. This typically takes 1-3 business days.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
