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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, CheckCircle, XCircle, Clock, Eye, User, Mail, Plus, AlertTriangle } from "lucide-react"

interface KYCDocument {
  id: string
  user_id: string
  account_no: string
  document_type: string
  document_number?: string
  document_url: string
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  submitted_at: string
  reviewed_at?: string
  user?: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    kyc_status: string
  }
}

const DOCUMENT_TYPES = [
  { id: "national_id", name: "National ID", required: true },
  { id: "passport", name: "Passport", required: false },
  { id: "drivers_license", name: "Driver's License", required: false },
  { id: "utility_bill", name: "Utility Bill", required: true },
  { id: "bank_statement", name: "Bank Statement", required: false },
]

interface AdminUser {
  id: string
  account_no: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  kyc_status: string
  account_balance: number
}

export default function AdminKYCPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false)
  const [newKYCData, setNewKYCData] = useState({
    documentType: "",
    documentNumber: "",
    documentUrl: "",
  })

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch KYC documents with user data
      const { data: kycData, error: kycError } = await supabase
        .from("kyc_documents")
        .select(`
          *,
          user:users!kyc_documents_user_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            kyc_status
          )
        `)
        .order("submitted_at", { ascending: false })

      if (kycError) throw kycError

      // Fetch all users for KYC submission
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, account_no, email, first_name, last_name, phone, kyc_status, account_balance")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      setDocuments(kycData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch KYC data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processKYC = async (documentId: string, userId: string, status: "approved" | "rejected") => {
    setIsProcessing(true)
    try {
      // Update KYC document
      const { error: docError } = await supabase
        .from("kyc_documents")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          rejection_reason: status === "rejected" ? reviewNotes : null,
        })
        .eq("id", documentId)

      if (docError) throw docError

      // Update user KYC status
      const kycStatus = status === "approved" ? "approved" : "rejected"
      const { error: userError } = await supabase
        .from("users")
        .update({
          kyc_status: kycStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (userError) throw userError

      // Send notification
      await sendKYCNotification(userId, status, reviewNotes)

      await fetchData()
      setSelectedDocument(null)
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
    if (!selectedUser || !newKYCData.documentType || !newKYCData.documentUrl) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingKYC(true)
    try {
      // Insert KYC document
      const { error: docError } = await supabase.from("kyc_documents").insert({
        user_id: selectedUser.id,
        account_no: selectedUser.account_no,
        document_type: newKYCData.documentType,
        document_number: newKYCData.documentNumber,
        document_url: newKYCData.documentUrl,
        status: "approved", // Admin submitted, so auto-approve
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })

      if (docError) throw docError

      // Update user KYC status
      const { error: userError } = await supabase
        .from("users")
        .update({
          kyc_status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id)

      if (userError) throw userError

      // Send notification
      await sendKYCNotification(selectedUser.id, "approved", "KYC completed by admin")

      await fetchData()
      setSelectedUser(null)
      setNewKYCData({ documentType: "", documentNumber: "", documentUrl: "" })

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
      setIsSubmittingKYC(false)
    }
  }

  const sendKYCNotification = async (userId: string, status: string, reason?: string) => {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          title: `KYC Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message:
            status === "approved"
              ? "Your KYC verification has been approved. You now have full access to all banking features."
              : `Your KYC verification has been rejected. ${reason ? `Reason: ${reason}` : "Please contact support for more information."}`,
          type: status === "approved" ? "success" : "error",
          sendEmail: true,
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
    const colors = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800",
      not_submitted: "bg-gray-100 text-gray-800",
    }

    const icons = {
      approved: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      not_submitted: <AlertTriangle className="h-3 w-3" />,
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.not_submitted}>
        {icons[status as keyof typeof icons] || icons.not_submitted}
        <span className="ml-1 capitalize">{status.replace("_", " ")}</span>
      </Badge>
    )
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.user?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.account_no.includes(searchTerm),
  )

  const pendingDocuments = documents.filter((doc) => doc.status === "pending")
  const usersWithoutKYC = users.filter((user) => user.kyc_status === "not_submitted")

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
          <p className="text-muted-foreground">Review and manage user KYC verifications</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingDocuments.length} Pending
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {usersWithoutKYC.length} No KYC
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="submit">Submit KYC</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {pendingDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  There are no pending KYC documents to review at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {doc.user?.first_name} {doc.user?.last_name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                    <CardDescription className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{doc.user?.email}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Account No.</p>
                        <p className="font-mono">{doc.account_no}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Document Type</p>
                        <p className="capitalize">{doc.document_type.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p>{doc.user?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p>{new Date(doc.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Review Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>KYC Document Review</DialogTitle>
                          <DialogDescription>
                            Review document for {doc.user?.first_name} {doc.user?.last_name}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedDocument && (
                          <div className="space-y-6">
                            {/* User Information */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                                <p className="font-semibold">
                                  {selectedDocument.user?.first_name} {selectedDocument.user?.last_name}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Email</Label>
                                <p>{selectedDocument.user?.email}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                <p>{selectedDocument.user?.phone || "Not provided"}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                                <p className="font-mono">{selectedDocument.account_no}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Type</Label>
                                <p className="capitalize">{selectedDocument.document_type.replace("_", " ")}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Number</Label>
                                <p className="font-mono">{selectedDocument.document_number || "Not provided"}</p>
                              </div>
                            </div>

                            {/* Document Image */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Submitted Document</h3>
                              <div className="border rounded-lg p-4">
                                <img
                                  src={selectedDocument.document_url || "/placeholder.svg"}
                                  alt="KYC Document"
                                  className="w-full max-h-96 object-contain rounded-lg"
                                />
                              </div>
                            </div>

                            {/* Review Notes */}
                            <div>
                              <Label htmlFor="notes">Review Notes (Required for rejection)</Label>
                              <Textarea
                                id="notes"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add notes about this review..."
                                rows={3}
                                className="mt-2"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                              <Button
                                onClick={() => processKYC(selectedDocument.id, selectedDocument.user_id, "approved")}
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
                                onClick={() => processKYC(selectedDocument.id, selectedDocument.user_id, "rejected")}
                                disabled={isProcessing || !reviewNotes.trim()}
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or account number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* All Documents */}
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold">
                          {doc.user?.first_name} {doc.user?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{doc.user?.email}</p>
                        <p className="text-xs text-muted-foreground">Account: {doc.account_no}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{doc.document_type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(doc.submitted_at).toLocaleDateString()}
                        </p>
                        {doc.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed: {new Date(doc.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(doc.status)}
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.document_url, "_blank")}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {doc.status === "rejected" && doc.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Rejection reason:</strong> {doc.rejection_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Submit KYC on Behalf of User
              </CardTitle>
              <CardDescription>
                Complete KYC verification for users who need assistance or have special circumstances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Selection */}
              <div>
                <Label>Select User</Label>
                <Select
                  onValueChange={(value) => {
                    const user = users.find((u) => u.id === value)
                    setSelectedUser(user || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user without KYC" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersWithoutKYC.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} - {user.email} ({user.account_no})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <>
                  {/* User Info */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Selected User</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p>
                          {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p>{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Account</p>
                        <p className="font-mono">{selectedUser.account_no}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Balance</p>
                        <p>${selectedUser.account_balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* KYC Form */}
                  <div className="space-y-4">
                    <div>
                      <Label>Document Type</Label>
                      <Select onValueChange={(value) => setNewKYCData({ ...newKYCData, documentType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} {type.required && "(Required)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Document Number (Optional)</Label>
                      <Input
                        value={newKYCData.documentNumber}
                        onChange={(e) => setNewKYCData({ ...newKYCData, documentNumber: e.target.value })}
                        placeholder="Enter document number if available"
                      />
                    </div>

                    <div>
                      <Label>Document URL</Label>
                      <Input
                        value={newKYCData.documentUrl}
                        onChange={(e) => setNewKYCData({ ...newKYCData, documentUrl: e.target.value })}
                        placeholder="Enter document URL or upload link"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Provide a secure URL to the document image or PDF
                      </p>
                    </div>

                    <Button
                      onClick={submitKYCForUser}
                      disabled={isSubmittingKYC || !newKYCData.documentType || !newKYCData.documentUrl}
                      className="w-full"
                    >
                      {isSubmittingKYC ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting KYC...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submit and Approve KYC
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {usersWithoutKYC.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All users have KYC!</h3>
                  <p className="text-muted-foreground">All registered users have completed their KYC verification.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
