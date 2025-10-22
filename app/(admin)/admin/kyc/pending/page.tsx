"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { sendKYCNotification } from "@/lib/notifications/handler"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface KYCDocument {
  id: string
  user_id: string
  account_no: string
  document_type: string
  document_url: string
  verification_status: string
  created_at: string
  users?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface PendingKYC {
  account_no: string
  first_name: string
  last_name: string
  email: string
  document_type: string
  document_url: string
  kyc_id: string
  created_at: string
}

export default function PendingKYCPage() {
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPendingKYC()
  }, [])

  const fetchPendingKYC = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("kyc_documents")
        .select(`
          id,
          user_id,
          document_type,
          document_url,
          verification_status,
          created_at,
          users (
            account_no,
            first_name,
            last_name,
            email
          )
        `)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedData = data
        .map((doc: any) => ({
          account_no: doc.users?.account_no || "",
          first_name: doc.users?.first_name || "",
          last_name: doc.users?.last_name || "",
          email: doc.users?.email || "",
          document_type: doc.document_type,
          document_url: doc.document_url,
          kyc_id: doc.id,
          created_at: doc.created_at,
        }))
        .filter((item): item is PendingKYC => !!item.account_no)

      setPendingKYC(formattedData)
    } catch (error) {
      console.error("Error fetching pending KYC:", error)
      toast({
        title: "Error",
        description: "Failed to fetch pending KYC documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (kyc: PendingKYC) => {
    try {
      setProcessing(kyc.kyc_id)

      // Update KYC document status
      const { error: kycError } = await supabase
        .from("kyc_documents")
        .update({
          verification_status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", kyc.kyc_id)

      if (kycError) throw kycError

      // Update user verification status
      const { error: userError } = await supabase
        .from("users")
        .update({
          verification_status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("account_no", kyc.account_no)

      if (userError) throw userError

      // Send notification
      await sendKYCNotification(kyc.account_no, "approved")

      toast({
        title: "Success",
        description: `KYC for ${kyc.first_name} ${kyc.last_name} approved`,
      })

      fetchPendingKYC()
    } catch (error) {
      console.error("Error approving KYC:", error)
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (kyc: PendingKYC) => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    try {
      setProcessing(kyc.kyc_id)

      // Update KYC document status
      const { error: kycError } = await supabase
        .from("kyc_documents")
        .update({
          verification_status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kyc.kyc_id)

      if (kycError) throw kycError

      // Update user verification status
      const { error: userError } = await supabase
        .from("users")
        .update({
          verification_status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("account_no", kyc.account_no)

      if (userError) throw userError

      // Send notification
      await sendKYCNotification(kyc.account_no, "rejected", reason)

      toast({
        title: "Success",
        description: `KYC for ${kyc.first_name} ${kyc.last_name} rejected`,
      })

      fetchPendingKYC()
    } catch (error) {
      console.error("Error rejecting KYC:", error)
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending KYC Verification</h1>
        <p className="text-muted-foreground mt-2">Review and approve/reject pending KYC documents from users</p>
      </div>

      {pendingKYC.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">No Pending KYC Documents</p>
            <p className="text-muted-foreground">All KYC submissions have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingKYC.map((kyc) => (
            <Card key={kyc.kyc_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{`${kyc.first_name} ${kyc.last_name}`}</CardTitle>
                    <CardDescription>{kyc.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <p className="text-base">{kyc.account_no}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                    <p className="text-base capitalize">{kyc.document_type.replace("_", " ")}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(kyc.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <a
                    href={kyc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    View Document
                  </a>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(kyc)}
                    disabled={processing === kyc.kyc_id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === kyc.kyc_id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </span>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(kyc)}
                    disabled={processing === kyc.kyc_id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === kyc.kyc_id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
