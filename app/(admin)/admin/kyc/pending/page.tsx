"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Search, CheckCircle, XCircle, Eye, Calendar, User, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendKYCStatusNotification } from "@/lib/notifications/handler"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface KYCApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  date_of_birth: string
  address: string
  city: string
  country: string
  kyc_status: string
  kyc_documents: any
  created_at: string
  updated_at: string
}

export default function KYCManagement() {
  const [applications, setApplications] = useState<KYCApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [statusFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)

      let query = supabase.from("users").select("*").order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("kyc_status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error("Error fetching KYC applications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch KYC applications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateKYCStatus = async (userId: string, newStatus: string, reason?: string) => {
    setProcessing(userId)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          kyc_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Send notification with email using the notification handler
      await sendKYCStatusNotification(userId, newStatus, reason)

      toast({
        title: "Success",
        description: `KYC status updated to ${newStatus} and email notification sent`,
      })

      fetchApplications()
      setSelectedApplication(null)
      setRejectionReason("")
    } catch (error) {
      console.error("Error updating KYC status:", error)
      toast({
        title: "Error",
        description: "Failed to update KYC status",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
        <p className="text-gray-600">Review and manage customer verification applications</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredApplications.length} applications</Badge>
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {application.first_name} {application.last_name}
                    </CardTitle>
                    <CardDescription>{application.email}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">{getStatusBadge(application.kyc_status)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{application.phone_number || "Not provided"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Applied: {new Date(application.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {application.city}, {application.country}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>KYC Application Details</DialogTitle>
                          <DialogDescription>Review the customer's verification information</DialogDescription>
                        </DialogHeader>
                        {selectedApplication && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Full Name</label>
                                <p>
                                  {selectedApplication.first_name} {selectedApplication.last_name}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p>{selectedApplication.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Phone</label>
                                <p>{selectedApplication.phone_number || "Not provided"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Date of Birth</label>
                                <p>{selectedApplication.date_of_birth || "Not provided"}</p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Address</label>
                                <p>{selectedApplication.address || "Not provided"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">City</label>
                                <p>{selectedApplication.city || "Not provided"}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Country</label>
                                <p>{selectedApplication.country || "Not provided"}</p>
                              </div>
                            </div>

                            {selectedApplication.kyc_status === "pending" && (
                              <div className="flex space-x-2 pt-4">
                                <Button
                                  onClick={() => updateKYCStatus(selectedApplication.id, "approved")}
                                  disabled={processing === selectedApplication.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {processing === selectedApplication.id ? "Approving..." : "Approve"}
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject KYC Application</DialogTitle>
                                      <DialogDescription>
                                        Please provide a reason for rejecting this application
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Textarea
                                        placeholder="Enter rejection reason..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                      <div className="flex space-x-2">
                                        <Button
                                          onClick={() =>
                                            updateKYCStatus(selectedApplication.id, "rejected", rejectionReason)
                                          }
                                          disabled={!rejectionReason.trim() || processing === selectedApplication.id}
                                          variant="destructive"
                                        >
                                          {processing === selectedApplication.id
                                            ? "Rejecting..."
                                            : "Reject Application"}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {application.kyc_status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateKYCStatus(application.id, "approved")}
                          disabled={processing === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processing === application.id ? "Approving..." : "Approve"}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(application.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-500">No KYC applications match your current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
