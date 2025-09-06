"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Eye, User, Mail } from "lucide-react"

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
  user: {
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
  }
}

export default function AdminKYCPendingPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingSubmissions()
  }, [])

  const fetchPendingSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select(`
          *,
          user:users!kyc_submissions_account_no_fkey (
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
      console.error("Error fetching KYC submissions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch KYC submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const processKYC = async (submissionId: string, accountNo: string, status: "approved" | "rejected") => {
    setIsProcessing(true)
    try {
      // Update KYC submission
      const { error: kycError } = await supabase
        .from("kyc_submissions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes,
        })
        .eq("id", submissionId)

      if (kycError) throw kycError

      // Update user verification status
      const verificationStatus = status === "approved" ? "verified" : "rejected"
      const { error: userError } = await supabase
        .from("users")
        .update({
          verification_status: verificationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("account_no", accountNo)

      if (userError) throw userError

      // Send notification
      await sendKYCNotification(accountNo, status, reviewNotes)

      await fetchPendingSubmissions()
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
          <h1 className="text-3xl font-bold">Pending KYC Reviews</h1>
          <p className="text-muted-foreground">Review and approve user verification documents</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {submissions.length} Pending
        </Badge>
      </div>

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
                      {submission.user.first_name} {submission.user.last_name}
                    </CardTitle>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{submission.user.email}</span>
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
                    <p className="capitalize">{submission.document_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p>{submission.user.phone || "Not provided"}</p>
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
                        Review documents for {submission.user.first_name} {submission.user.last_name}
                      </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                      <div className="space-y-6">
                        {/* User Information */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                            <p className="font-semibold">
                              {selectedSubmission.user.first_name} {selectedSubmission.user.last_name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Email</Label>
                            <p>{selectedSubmission.user.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Phone</Label>
                            <p>{selectedSubmission.user.phone || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                            <p>
                              {selectedSubmission.user.date_of_birth
                                ? new Date(selectedSubmission.user.date_of_birth).toLocaleDateString()
                                : "Not provided"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Document Type</Label>
                            <p className="capitalize">{selectedSubmission.document_type}</p>
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
                                src={selectedSubmission.document_front_url || "/placeholder.svg"}
                                alt="Document Front"
                                className="w-full h-48 object-cover rounded-lg border mt-2"
                              />
                            </div>
                            {selectedSubmission.document_back_url && (
                              <div>
                                <Label className="text-sm font-medium text-gray-600">Document Back</Label>
                                <img
                                  src={selectedSubmission.document_back_url || "/placeholder.svg"}
                                  alt="Document Back"
                                  className="w-full h-48 object-cover rounded-lg border mt-2"
                                />
                              </div>
                            )}
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Selfie</Label>
                              <img
                                src={selectedSubmission.selfie_url || "/placeholder.svg"}
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
                            onClick={() => processKYC(selectedSubmission.id, selectedSubmission.account_no, "approved")}
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
                            onClick={() => processKYC(selectedSubmission.id, selectedSubmission.account_no, "rejected")}
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
    </div>
  )
}
