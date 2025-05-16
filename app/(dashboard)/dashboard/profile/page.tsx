"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { User, Phone, Mail, Shield, Edit2, Check, AlertCircle, MapPin, Globe, Copy, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: "",
    city: "",
    country: "",
  })
  const [kycDocuments, setKycDocuments] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        phoneNumber: profile.phone_number || "",
        city: profile.city || "",
        country: profile.country || "",
      })
    }
  }, [profile])

  // Fetch additional user data
  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch KYC documents
      const { data: kycData, error: kycError } = await supabase
        .from("kyc_documents")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!kycError && kycData) {
        setKycDocuments(kycData)
      }

      // Fetch referrals with joined data
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          *,
          referred:referred_id(
            first_name,
            last_name,
            email,
            created_at
          )
        `)
        .eq("referrer_id", user.id)

      if (!referralsError && referralsData) {
        setReferrals(referralsData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsLoading(true)

    try {
      // Update both users and user_profiles tables
      const { error: usersError } = await supabase
        .from("users")
        .update({
          phone_number: formData.phoneNumber,
          city: formData.city,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (usersError) {
        throw new Error(usersError.message)
      }

      const { error: profilesError } = await supabase
        .from("user_profiles")
        .update({
          phone_number: formData.phoneNumber,
          city: formData.city,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (profilesError) {
        console.error("Error updating user_profiles:", profilesError)
      }

      // Refresh user profile data in context
      await refreshUserProfile()

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setIsEditing(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email!,
      })

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Success",
        description: "Verification email sent. Please check your inbox.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerificationSMS = async () => {
    if (!user || !profile) return

    setIsLoading(true)

    try {
      // In a real app, you would send an SMS with a verification code
      // For this demo, we'll simulate a successful verification

      toast({
        title: "Success",
        description: "Verification SMS sent. Please check your phone.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: message,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-6 gap-2 sm:gap-0">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Manage your personal details</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={profile?.first_name || ""} disabled className="bg-gray-100" />
                        <p className="text-xs text-gray-500">First name cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={profile?.last_name || ""} disabled className="bg-gray-100" />
                        <p className="text-xs text-gray-500">Last name cannot be changed</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-gray-100" />
                      <p className="text-xs text-gray-500">To change your email, please contact support.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#0A5483] hover:bg-[#0F7AB3] w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-6 w-6 text-[#0A5483]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        {profile ? `${profile.first_name} ${profile.last_name}` : "Loading..."}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Account #{profile?.account_number}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() =>
                            copyToClipboard(profile?.account_number || "", "Account number copied to clipboard")
                          }
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy account number</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b pb-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <div className="ml-auto">
                        {profile?.email_verified ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-b pb-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-500">{profile?.phone_number || "Not provided"}</p>
                      </div>
                      <div className="ml-auto">
                        {profile?.phone_verified ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-b pb-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">City</p>
                        <p className="text-sm text-gray-500">{profile?.city || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-b pb-3">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Country</p>
                        <p className="text-sm text-gray-500">{profile?.country || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-b pb-3">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Account Balance</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(profile?.balance || 0)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">KYC Status</p>
                        <p className="text-sm text-gray-500">
                          {profile?.kyc_status === "approved"
                            ? "Verified"
                            : profile?.kyc_status === "pending"
                              ? "Pending Review"
                              : "Not Submitted"}
                        </p>
                      </div>
                      <div className="ml-auto">
                        {profile?.kyc_status === "approved" ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        ) : profile?.kyc_status === "pending" ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
              <CardDescription>Verify your identity to unlock all features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${profile?.email_verified ? "bg-green-100" : "bg-yellow-100"}`}>
                    <Mail className={`h-5 w-5 ${profile?.email_verified ? "text-green-600" : "text-yellow-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Email Verification</h3>
                    <p className="text-sm text-gray-500">
                      {profile?.email_verified
                        ? "Your email has been verified."
                        : "Verify your email to secure your account."}
                    </p>
                  </div>
                  {!profile?.email_verified && (
                    <Button variant="outline" size="sm" onClick={handleSendVerificationEmail} disabled={isLoading}>
                      Verify Email
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${profile?.phone_verified ? "bg-green-100" : "bg-yellow-100"}`}>
                    <Phone className={`h-5 w-5 ${profile?.phone_verified ? "text-green-600" : "text-yellow-600"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Phone Verification</h3>
                    <p className="text-sm text-gray-500">
                      {profile?.phone_verified
                        ? "Your phone number has been verified."
                        : "Verify your phone number for additional security."}
                    </p>
                  </div>
                  {!profile?.phone_verified && (
                    <Button variant="outline" size="sm" onClick={handleSendVerificationSMS} disabled={isLoading}>
                      Verify Phone
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`rounded-full p-2 ${
                      profile?.kyc_status === "approved"
                        ? "bg-green-100"
                        : profile?.kyc_status === "pending"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                    }`}
                  >
                    <Shield
                      className={`h-5 w-5 ${
                        profile?.kyc_status === "approved"
                          ? "text-green-600"
                          : profile?.kyc_status === "pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Identity Verification (KYC)</h3>
                    <p className="text-sm text-gray-500">
                      {profile?.kyc_status === "approved"
                        ? "Your identity has been verified."
                        : profile?.kyc_status === "pending"
                          ? "Your identity verification is under review."
                          : "Verify your identity to unlock all features."}
                    </p>
                    {kycDocuments && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>ID Type: {kycDocuments.id_type}</p>
                        <p>Submitted: {new Date(kycDocuments.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  {profile?.kyc_status !== "approved" && profile?.kyc_status !== "pending" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-[#0A5483] hover:bg-[#0F7AB3]" size="sm">
                          Complete KYC
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Identity Verification</DialogTitle>
                          <DialogDescription>
                            Verify your identity to unlock all features of your account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="idType">ID Type</Label>
                            <select id="idType" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                              <option value="national_id">National ID</option>
                              <option value="passport">Passport</option>
                              <option value="drivers_license">Driver's License</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="idNumber">ID Number</Label>
                            <Input id="idNumber" placeholder="Enter your ID number" />
                          </div>
                          <div className="space-y-2">
                            <Label>Upload Front of ID</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                              <p className="text-sm text-gray-500">Drag and drop your ID, or click to browse</p>
                              <Input type="file" className="hidden" id="front-id" />
                              <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => document.getElementById("front-id")?.click()}
                              >
                                Upload
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Upload Back of ID</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                              <p className="text-sm text-gray-500">Drag and drop your ID, or click to browse</p>
                              <Input type="file" className="hidden" id="back-id" />
                              <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => document.getElementById("back-id")?.click()}
                              >
                                Upload
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button className="bg-[#0A5483] hover:bg-[#0F7AB3]">Submit for Verification</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {profile?.kyc_status !== "approved" && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Limited Account Access</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Your account has limited functionality until your identity is verified. Complete the KYC
                          process to unlock all features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Shield className="h-5 w-5 text-[#0A5483]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-gray-500">Change your account password</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>Enter your current password and a new password.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="bg-[#0A5483] hover:bg-[#0F7AB3]">Update Password</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Shield className="h-5 w-5 text-[#0A5483]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Shield className="h-5 w-5 text-[#0A5483]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Login History</h3>
                    <p className="text-sm text-gray-500">View your recent login activity</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referrals</CardTitle>
              <CardDescription>Invite friends and earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="font-medium text-[#0A5483] mb-2">Your Referral Link</h3>
                  <div className="flex items-center gap-2">
                    <Input value={`https://iebank.com/ref/${user?.id}`} readOnly className="bg-white" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://iebank.com/ref/${user?.id}`)
                        toast({
                          title: "Copied!",
                          description: "Referral link copied to clipboard",
                        })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Share this link with friends. When they sign up and complete KYC, you'll both receive a $25 bonus!
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Your Referrals</h3>
                  {referrals.length > 0 ? (
                    <div className="space-y-4">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between border-b pb-3">
                          <div>
                            <p className="font-medium">
                              {referral.referred?.first_name} {referral.referred?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                referral.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {referral.status === "completed" ? "Completed" : "Pending"}
                            </span>
                            {referral.status === "completed" && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                +${referral.bonus_amount.toFixed(2)} Bonus
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded-md">
                      <p>You haven't referred anyone yet</p>
                      <p className="text-sm mt-1">Share your referral link to start earning rewards!</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
