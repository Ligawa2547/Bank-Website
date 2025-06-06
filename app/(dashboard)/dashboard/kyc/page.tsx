"use client"

import { useState, useEffect } from "react"
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
  { id: "national_id", name: "National ID", icon: User, required: true },
  { id: "passport", name: "Passport", icon: FileText, required: false },
  { id: "drivers_license", name: "Driver's License", icon: CreditCard, required: false },
  { id: "utility_bill", name: "Utility Bill", icon: Home, required: true },
  { id: "bank_statement", name: "Bank Statement", icon: Building, required: false },
]

const KYC_FEE = 35

export default function KYCPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
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

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!user) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, JPG, or PNG file",
        variant: "destructive",
      })
      return
    }

    setUploading(documentType)

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(fileName)

      // Save document record
      const { error: insertError } = await supabase.from("kyc_documents").insert({
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        status: "pending",
      })

      if (insertError) throw insertError

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      })

      fetchDocuments()
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
        account_number: profile.account_number,
        transaction_type: "withdrawal",
        amount: KYC_FEE,
        description: "KYC Verification Fee",
        reference: `KYC_${Date.now()}`,
        status: "completed",
      })

      if (transactionError) throw transactionError

      toast({
        title: "KYC submitted successfully",
        description: `Your KYC verification has been submitted. Fee of $${KYC_FEE} has been deducted.`,
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

      {/* KYC Status Alert */}
      {profile?.kyc_status === "not_submitted" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your KYC verification to access all banking features. A one-time fee of ${KYC_FEE} applies.
          </AlertDescription>
        </Alert>
      )}

      {profile?.kyc_status === "pending" && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your KYC verification is under review. We'll notify you once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {profile?.kyc_status === "approved" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your KYC verification is complete! All banking features are now available.
          </AlertDescription>
        </Alert>
      )}

      {profile?.kyc_status === "rejected" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Your KYC verification was rejected. Please resubmit your documents with the required corrections.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Verification Progress
              </CardTitle>
              <CardDescription>Upload required documents to complete your verification</CardDescription>
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

          {/* Fee Information */}
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

          {/* Document Upload */}
          <div className="grid gap-4 md:grid-cols-2">
            {DOCUMENT_TYPES.map((docType) => {
              const uploadedDoc = documents.find((doc) => doc.document_type === docType.id)
              const Icon = docType.icon

              return (
                <Card key={docType.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" />
                      {docType.name}
                      {docType.required && <Badge variant="secondary">Required</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {uploadedDoc ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{uploadedDoc.file_name}</span>
                          <Badge className={getStatusColor(uploadedDoc.status)}>
                            {getStatusIcon(uploadedDoc.status)}
                            <span className="ml-1 capitalize">{uploadedDoc.status}</span>
                          </Badge>
                        </div>
                        {uploadedDoc.status === "rejected" && uploadedDoc.rejection_reason && (
                          <p className="text-sm text-red-600">{uploadedDoc.rejection_reason}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
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
                        <label
                          htmlFor={`upload-${docType.id}`}
                          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          {uploading === docType.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {uploading === docType.id ? "Uploading..." : "Upload Document"}
                          </span>
                        </label>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Submit Button */}
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
                          </div>
                        </div>
                        <Badge className={getStatusColor(doc.status)}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1 capitalize">{doc.status}</span>
                        </Badge>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
