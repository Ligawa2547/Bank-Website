"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Eye, User, Mail, CheckCircle, XCircle, AlertCircle, Plus, FileText } from "lucide-react"

interface KYCSubmission {
  id: string
  account_no: string
  document_type: string
  document_number: string
  document_front_url: string
  document_back_url: string
  selfie_url: string
  status: string
  submitted_at: string
  reviewed_at?: string
  reviewer_notes?: string
  users: {
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
  }
}

const DOCUMENT_TYPES = [
  { value: "national_id", label: "National ID Card" },
  { value: "passport", label: "International Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "bank_statement", label: "Bank Statement" },
]

interface AdminUser {
  id: string
  account_no: string
  first_name: string
  last_name: string
  email: string
  phone: string
  kyc_status: string
  verification_status: string
}

export default function AdminKYCPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([])
  const [allSubmissions, setAllSubmissions] = useState<KYCSubmission[]>([])
  const [unverifiedUsers, setUnverifiedUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Admin KYC submission form
  const [selectedUser, setSelectedUser] = useState("")
  const [documentType, setDocumentType] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [documentUrl, setDocumentUrl] = useState("")
  const [submittingKYC, setSubmittingKYC] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchPendingSubmissions(), fetchAllSubmissions(), fetchUnverifiedUsers()])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select(`
          *,
          users!kyc_submissions_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching pending submissions:", error)
    }
  }

  const fetchAllSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select(`
          *,
          users!kyc_submissions_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `)
        .order("submitted_at", { ascending: false })

      if (error) throw error
      setAllSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching all submissions:", error)
    }
  }

  const fetchUnverifiedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, account_no, first_name, last_name, email, phone, kyc_status, verification_status")
        .or("kyc_status.is.null,kyc_status.eq.not_submitted,verification_status.eq.unverified")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUnverifiedUsers(data || [])
    } catch (error) {
      console.error("Error fetching unverified users:", error)
    }
  }

  const processKYC = async (submissionId: string, accountNo: string, status: "approved" | "rejected") => {
    setIsProcessing(true)
    try {
      const { error: kycError } = await supabase
        .from("kyc_submissions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes,
        })
        .eq("id", submissionId)

      if (kycError) throw kycError

      await sendKYCNotification(accountNo, status, reviewNotes)
      await fetchData()
      setSelectedSubmission(null)
      setReviewNotes("")

      toast({
        title: "Success",
        description: `KYC ${status} successfully`,
      })
    } catch (error) {
      console.error("Error processing KYC:", error)
      toast({
        title: "Error",
        description: "Failed to process KYC",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const submitKYCForUser = async () => {
    if (!selectedUser || !documentType || !documentNumber || !documentUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmittingKYC(true)
    try {
      const user = unverifiedUsers.find((u) => u.id === selectedUser)
      if (!user) throw new Error("User not found")

      // Create KYC submission
      const { error: kycError } = await supabase.from("kyc_submissions").insert({
        user_id: selectedUser,
        account_no: user.account_no,
        document_type: documentType,
        document_number: documentNumber,
        document_front_url: documentUrl,
        status: "approved", // Admin submissions are auto-approved
        reviewed_at: new Date().toISOString(),
        reviewer_notes: "Submitted and approved by admin",
      })

      if (kycError) throw kycError

      // Send approval notification
      await sendKYCNotification(user.account_no, "approved", "Your KYC has been completed by our admin team")

      // Reset form
      setSelectedUser("")
      setDocumentType("")
      setDocumentNumber("")
      setDocumentUrl("")

      await fetchData()

      toast({
        title: "Success",
        description: "KYC submitted and approved for user",
      })
    } catch (error) {
      console.error("Error submitting KYC:", error)
      toast({
        title: "Error",
        description: "Failed to submit KYC for user",
        variant: "destructive",
      })
    } finally {
      setSubmittingKYC(false)
    }
  }

  const sendKYCNotification = async (accountNo: string, status: string, reason?: string) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "kyc",
          accountNo,
          status,
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }
    } catch (error) {
      console.error("Error sending KYC notification:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredSubmissions = allSubmissions.filter(
    (submission) =>
      submission.users.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.users.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.account_no.includes(searchTerm),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">KYC Management</h1>
          <p className="text-muted-foreground">Manage user identity verification documents</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Pending Reviews ({submissions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>All Documents ({allSubmissions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="submit" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Submit KYC</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  There are no pending KYC submissions to review at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {submission.users.first_name} {submission.users.last_name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                    <CardDescription className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{submission.users.email}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Account No.</p>
                        <p className="font-mono">{submission.account_no}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Document Type</p>
                        <p className="capitalize">{submission.document_type.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p>{submission.users.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p>{new Date(submission.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedSubmission(submission)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review Documents
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>KYC Document Review</DialogTitle>
                          <DialogDescription>
                            Review documents for {submission.users.first_name} {submission.users.last_name}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedSubmission && (
                          <div className="space-y-6">
                            {/* User Information */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                                <p className="font-semibold">
                                  {selectedSubmission.users.first_name} {selectedSubmission.users.last_name}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Email</Label>
                                <p>{selectedSubmission.users.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                <p>{selectedSubmission.users.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                                <p>
                                  {selectedSubmission.users.date_of_birth
                                    ? new Date(selectedSubmission.users.date_of_birth).toLocaleDateString()
                                    : "Not provided"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Type</Label>
                                <p className="capitalize">{selectedSubmission.document_type.replace("_", " ")}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Number</Label>
                                <p className="font-mono">{selectedSubmission.document_number}</p>
                              </div>
                            </div>

                            {/* Document Images */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Submitted Documents</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Document Front</Label>
                                  <img
                                    src={
                                      selectedSubmission.document_front_url || "/placeholder.svg?height=200&width=300"
                                    }
                                    alt="Document Front"
                                    className="w-full h-48 object-cover rounded-lg border mt-2"
                                  />
                                </div>
                                {selectedSubmission.document_back_url && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Document Back</Label>
                                    <img
                                      src={
                                        selectedSubmission.document_back_url || "/placeholder.svg?height=200&width=300"
                                      }
                                      alt="Document Back"
                                      className="w-full h-48 object-cover rounded-lg border mt-2"
                                    />
                                  </div>
                                )}
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Selfie</Label>
                                  <img
                                    src={selectedSubmission.selfie_url || "/placeholder.svg?height=200&width=300"}
                                    alt="Selfie"
                                    className="w-full h-48 object-cover rounded-lg border mt-2"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Review Notes */}
                            <div>
                              <Label htmlFor="notes">Review Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add any notes about this review..."
                                rows={3}
                                className="mt-2"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                              <Button
                                onClick={() =>
                                  processKYC(selectedSubmission.id, selectedSubmission.account_no, "approved")
                                }
                                disabled={isProcessing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Approve
                              </Button>
                              <Button
                                onClick={() =>
                                  processKYC(selectedSubmission.id, selectedSubmission.account_no, "rejected")
                                }
                                disabled={isProcessing}
                                variant="destructive"
                                className="flex-1"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(submission.status)}
                    <div>
                      <p className="font-semibold">
                        {submission.users.first_name} {submission.users.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{submission.users.email}</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-mono">{submission.account_no}</p>
                      <p className="text-muted-foreground capitalize">{submission.document_type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <p>{new Date(submission.submitted_at).toLocaleDateString()}</p>
                      {submission.reviewed_at && (
                        <p className="text-muted-foreground">
                          Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(submission.status)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>KYC Document Details</DialogTitle>
                          <DialogDescription>
                            View documents for {submission.users.first_name} {submission.users.last_name}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedSubmission && (
                          <div className="space-y-6">
                            {/* User Information */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                                <p className="font-semibold">
                                  {selectedSubmission.users.first_name} {selectedSubmission.users.last_name}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Email</Label>
                                <p>{selectedSubmission.users.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Type</Label>
                                <p className="capitalize">{selectedSubmission.document_type.replace("_", " ")}</p>
                              </div>
                            </div>

                            {/* Document Images */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Documents</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Document Front</Label>
                                  <img
                                    src={
                                      selectedSubmission.document_front_url || "/placeholder.svg?height=200&width=300"
                                    }
                                    alt="Document Front"
                                    className="w-full h-48 object-cover rounded-lg border mt-2"
                                  />
                                </div>
                                {selectedSubmission.document_back_url && (
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Document Back</Label>
                                    <img
                                      src={
                                        selectedSubmission.document_back_url || "/placeholder.svg?height=200&width=300"
                                      }
                                      alt="Document Back"
                                      className="w-full h-48 object-cover rounded-lg border mt-2"
                                    />
                                  </div>
                                )}
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Selfie</Label>
                                  <img
                                    src={selectedSubmission.selfie_url || "/placeholder.svg?height=200&width=300"}
                                    alt="Selfie"
                                    className="w-full h-48 object-cover rounded-lg border mt-2"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Review Notes if available */}
                            {selectedSubmission.reviewer_notes && (
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Review Notes</Label>
                                <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedSubmission.reviewer_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit KYC on Behalf of User</CardTitle>
              <CardDescription>
                Complete KYC verification for users who need assistance. Admin submissions are automatically approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="user-select">Select User *</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user without KYC" />
                    </SelectTrigger>
                    <SelectContent>
                      {unverifiedUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.account_no})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">Only users without completed KYC are shown</p>
                </div>

                <div>
                  <Label htmlFor="document-type-admin">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document-number-admin">Document Number *</Label>
                  <Input
                    id="document-number-admin"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter document number"
                  />
                </div>

                <div>
                  <Label htmlFor="document-url">Document URL *</Label>
                  <Input
                    id="document-url"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="Enter secure document URL"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Provide a secure link to the document image</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Admin KYC Submission:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Admin submissions are automatically approved</li>
                  <li>• User will receive immediate approval notification</li>
                  <li>• No KYC fee will be charged to the user</li>
                  <li>• User gets full banking access immediately</li>
                </ul>
              </div>

              <Button
                onClick={submitKYCForUser}
                disabled={submittingKYC || !selectedUser || !documentType || !documentNumber || !documentUrl}
                className="w-full"
              >
                {submittingKYC ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting KYC...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit & Approve KYC
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {unverifiedUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users Without KYC ({unverifiedUsers.length})</CardTitle>
                <CardDescription>Users who haven't completed identity verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unverifiedUsers.slice(0, 10).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {user.account_no}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(user.id)}>
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                  {unverifiedUsers.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {unverifiedUsers.length - 10} more users...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
