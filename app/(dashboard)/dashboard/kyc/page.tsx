"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createClient } from "@/lib/supabase/client"
import {
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  CreditCard,
  FileText,
  User,
  Home,
  Building,
  Camera,
  File,
  Trash2,
  Eye,
  Shield,
  Award,
} from "lucide-react"

interface KYCDocument {
  id: string
  document_type: string
  file_name: string
  file_url: string
  status: "pending" | "approved" | "rejected"
  uploaded_at: string
  rejection_reason?: string
}

const DOCUMENT_TYPES = [
  {
    id: "national_id",
    name: "National ID",
    icon: User,
    required: true,
    description: "Government-issued national identity card",
  },
  { id: "passport", name: "Passport", icon: FileText, required: false, description: "International passport document" },
  {
    id: "drivers_license",
    name: "Driver's License",
    icon: CreditCard,
    required: false,
    description: "Valid driver's license",
  },
  {
    id: "utility_bill",
    name: "Utility Bill",
    icon: Home,
    required: true,
    description: "Recent utility bill (electricity, water, gas)",
  },
  {
    id: "bank_statement",
    name: "Bank Statement",
    icon: Building,
    required: false,
    description: "Recent bank account statement",
  },
]

const KYC_FEE = 35

// Supported file types
const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/svg+xml",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function KYCPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("uploaded_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load KYC documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }

    // Check file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return "Unsupported file format. Please upload PDF, JPG, PNG, GIF, BMP, WebP, TIFF, or SVG files"
    }

    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return

    // Prevent uploads if KYC is already submitted or approved
    if (profile?.kyc_status === "pending" || profile?.kyc_status === "approved") {
      toast({
        title: "Upload not allowed",
        description: "You cannot upload documents when KYC is already submitted or approved.",
        variant: "destructive",
      })
      return
    }

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setUploading(documentType)

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(fileName)

      // Delete existing document of the same type if it exists
      const existingDoc = documents.find((doc) => doc.document_type === documentType)
      if (existingDoc) {
        await supabase.from("kyc_documents").delete().eq("id", existingDoc.id)

        // Also delete the old file from storage
        const oldFileName = existingDoc.file_url.split("/").pop()
        if (oldFileName) {
          await supabase.storage.from("kyc-documents").remove([`${user.id}/${oldFileName}`])
        }
      }

      // Save document record
      const { error: insertError } = await supabase.from("kyc_documents").insert({
        user_id: user.id,
        account_no: profile?.account_number,
        document_type: documentType,
        document_number: file.name.split(".")[0], // Use filename without extension as document number
        document_url: urlData.publicUrl,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      toast({
        title: "Document uploaded successfully",
        description: `${DOCUMENT_TYPES.find((dt) => dt.id === documentType)?.name} has been uploaded and is pending review`,
      })

      fetchDocuments()

      // Clear the file input
      if (fileInputRefs.current[documentType]) {
        fileInputRefs.current[documentType]!.value = ""
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const handleDrop = (e: React.DragEvent, documentType: string) => {
    e.preventDefault()
    setDragOver(null)

    // Prevent drops if KYC is already submitted or approved
    if (profile?.kyc_status === "pending" || profile?.kyc_status === "approved") {
      toast({
        title: "Upload not allowed",
        description: "You cannot upload documents when KYC is already submitted or approved.",
        variant: "destructive",
      })
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(documentType, files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent, documentType: string) => {
    e.preventDefault()
    // Only allow drag over if KYC is not submitted or approved
    if (profile?.kyc_status !== "pending" && profile?.kyc_status !== "approved") {
      setDragOver(documentType)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }

  const deleteDocument = async (docId: string, documentType: string) => {
    // Prevent deletion if KYC is already submitted or approved
    if (profile?.kyc_status === "pending" || profile?.kyc_status === "approved") {
      toast({
        title: "Delete not allowed",
        description: "You cannot delete documents when KYC is already submitted or approved.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("kyc_documents").delete().eq("id", docId)
      if (error) throw error

      toast({
        title: "Document deleted",
        description: "Document has been removed successfully",
      })

      fetchDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const viewDocument = (url: string) => {
    window.open(url, "_blank")
  }

  const handleSubmitKYC = async () => {
    if (!user || !profile) return

    // Check if user has sufficient balance
    const userBalance = typeof profile.balance === "number" ? profile.balance : 0
    if (userBalance < KYC_FEE) {
      toast({
        title: "Insufficient balance",
        description: `You need at least $${KYC_FEE} to submit KYC verification`,
        variant: "destructive",
      })
      return
    }

    // Check if required documents are uploaded
    const requiredDocs = DOCUMENT_TYPES.filter((doc) => doc.required)
    const uploadedRequiredDocs = requiredDocs.filter((doc) => documents.some((d) => d.document_type === doc.id))

    if (uploadedRequiredDocs.length < requiredDocs.length) {
      toast({
        title: "Missing documents",
        description: "Please upload all required documents before submitting",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Deduct KYC fee and update status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          account_balance: userBalance - KYC_FEE,
          kyc_status: "pending",
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Record the fee transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        account_no: profile.account_number,
        transaction_type: "withdrawal",
        amount: KYC_FEE,
        narration: "KYC Verification Fee",
        reference: `KYC_${Date.now()}`,
        status: "completed",
      })

      if (transactionError) throw transactionError

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        account_no: profile.account_number,
        title: "KYC Verification Submitted",
        message: `Your KYC verification has been submitted for review. Fee of $${KYC_FEE} has been deducted from your account.`,
        is_read: false,
      })

      toast({
        title: "KYC submitted successfully",
        description: `Your KYC verification has been submitted for review. Fee of $${KYC_FEE} has been deducted.`,
      })

      // Refresh profile to get updated status
      refreshProfile()
    } catch (error) {
      console.error("Error submitting KYC:", error)
      toast({
        title: "Submission failed",
        description: "Failed to submit KYC verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const calculateProgress = () => {
    const requiredDocs = DOCUMENT_TYPES.filter((doc) => doc.required)
    const uploadedRequiredDocs = requiredDocs.filter((doc) => documents.some((d) => d.document_type === doc.id))
    return (uploadedRequiredDocs.length / requiredDocs.length) * 100
  }

  const canUploadDocuments = () => {
    return profile?.kyc_status === "not_submitted" || profile?.kyc_status === "rejected"
  }

  const renderKYCStatusMessage = () => {
    switch (profile?.kyc_status) {
      case "approved":
        return (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-green-800 mb-2">KYC Verification Approved!</h3>
                  <p className="text-green-700 mb-4">
                    Congratulations! Your identity has been successfully verified. You now have full access to all
                    banking features.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>Your account is fully verified and secure</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "pending":
        return (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-yellow-800 mb-2">KYC Under Review</h3>
                  <p className="text-yellow-700 mb-4">
                    Your KYC verification is currently being reviewed by our team. This process typically takes 1-3
                    business days.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                    <FileCheck className="h-4 w-4" />
                    <span>We'll notify you once the review is complete</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "rejected":
        return (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-red-800 mb-2">KYC Verification Rejected</h3>
                  <p className="text-red-700 mb-4">
                    Your KYC verification was rejected. Please review the feedback below and resubmit your documents
                    with the required corrections.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>You can upload new documents to resubmit your verification</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600">Complete your identity verification to unlock all features</p>
        </div>
        <Badge className={getStatusColor(profile?.kyc_status || "not_submitted")}>
          {getStatusIcon(profile?.kyc_status || "not_submitted")}
          <span className="ml-1 capitalize">{profile?.kyc_status?.replace("_", " ") || "Not Submitted"}</span>
        </Badge>
      </div>

      {/* KYC Status Message */}
      {renderKYCStatusMessage()}

      {/* KYC Status Alert for not_submitted */}
      {profile?.kyc_status === "not_submitted" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your KYC verification to access all banking features. A one-time fee of ${KYC_FEE} applies.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Only show progress and fee info if KYC is not approved */}
          {profile?.kyc_status !== "approved" && (
            <>
              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Verification Progress
                  </CardTitle>
                  <CardDescription>
                    {profile?.kyc_status === "pending"
                      ? "Your documents are under review"
                      : "Upload required documents to complete your verification"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(calculateProgress())}% Complete</span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Fee Information - only show if not submitted */}
              {profile?.kyc_status === "not_submitted" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Verification Fee
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">KYC Verification Fee</p>
                        <p className="text-sm text-gray-600">One-time identity verification charge</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">${KYC_FEE}</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Current Balance: ${typeof profile?.balance === "number" ? profile.balance.toFixed(2) : "0.00"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Document Upload/View */}
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {DOCUMENT_TYPES.map((docType) => {
              const uploadedDoc = documents.find((doc) => doc.document_type === docType.id)
              const Icon = docType.icon
              const isDragOver = dragOver === docType.id
              const canUpload = canUploadDocuments()

              return (
                <Card key={docType.id} className={isDragOver ? "border-blue-500 bg-blue-50" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" />
                      {docType.name}
                      {docType.required && <Badge variant="secondary">Required</Badge>}
                    </CardTitle>
                    <CardDescription className="text-sm">{docType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploadedDoc ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium truncate max-w-[150px]" title={uploadedDoc.file_name}>
                              {uploadedDoc.file_name}
                            </span>
                          </div>
                          <Badge className={getStatusColor(uploadedDoc.status)}>
                            {getStatusIcon(uploadedDoc.status)}
                            <span className="ml-1 capitalize">{uploadedDoc.status}</span>
                          </Badge>
                        </div>

                        {uploadedDoc.status === "rejected" && uploadedDoc.rejection_reason && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Rejection reason:</strong> {uploadedDoc.rejection_reason}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => viewDocument(uploadedDoc.file_url)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            {canUpload && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteDocument(uploadedDoc.id, docType.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>

                        {canUpload && (
                          <div className="pt-2 border-t">
                            <input
                              ref={(el) => (fileInputRefs.current[docType.id] = el)}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.svg"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleFileUpload(docType.id, file)
                                }
                              }}
                              className="hidden"
                              id={`reupload-${docType.id}`}
                              disabled={uploading === docType.id}
                            />
                            <label
                              htmlFor={`reupload-${docType.id}`}
                              className="flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400 transition-colors text-sm"
                            >
                              <Upload className="h-3 w-3" />
                              Replace Document
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {canUpload ? (
                          <>
                            <input
                              ref={(el) => (fileInputRefs.current[docType.id] = el)}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.svg"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleFileUpload(docType.id, file)
                                }
                              }}
                              className="hidden"
                              id={`upload-${docType.id}`}
                              disabled={uploading === docType.id}
                            />

                            {/* Drag and Drop Area */}
                            <div
                              onDrop={(e) => handleDrop(e, docType.id)}
                              onDragOver={(e) => handleDragOver(e, docType.id)}
                              onDragLeave={handleDragLeave}
                              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {uploading === docType.id ? (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  <p className="text-sm text-gray-600">Uploading...</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <Camera className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      Drop your file here or{" "}
                                      <label
                                        htmlFor={`upload-${docType.id}`}
                                        className="text-blue-600 hover:text-blue-700 cursor-pointer underline"
                                      >
                                        browse
                                      </label>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      PDF, JPG, PNG, GIF, BMP, WebP, TIFF, SVG
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex flex-col items-center gap-3">
                              <FileCheck className="h-8 w-8 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Document upload not available</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {profile?.kyc_status === "pending"
                                    ? "Your KYC is under review"
                                    : "KYC verification is complete"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Submit Button - only show if not submitted */}
          {profile?.kyc_status === "not_submitted" && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSubmitKYC}
                  disabled={
                    submitting ||
                    calculateProgress() < 100 ||
                    (typeof profile?.balance === "number" ? profile.balance : 0) < KYC_FEE
                  }
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </div>
                  ) : (
                    `Submit KYC Verification ($${KYC_FEE})`
                  )}
                </Button>
                <p className="text-sm text-gray-600 text-center mt-2">
                  By submitting, you agree to pay the ${KYC_FEE} verification fee
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Track the progress of your KYC verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc) => {
                    const docType = DOCUMENT_TYPES.find((type) => type.id === doc.document_type)
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {docType && <docType.icon className="h-4 w-4" />}
                          <div>
                            <p className="font-medium">{docType?.name || doc.document_type}</p>
                            <p className="text-sm text-gray-600">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                            {doc.status === "rejected" && doc.rejection_reason && (
                              <p className="text-xs text-red-600 mt-1">Reason: {doc.rejection_reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1 capitalize">{doc.status}</span>
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => viewDocument(doc.file_url)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400">
                      {canUploadDocuments()
                        ? "Upload your documents to get started"
                        : "Your KYC verification is complete"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
