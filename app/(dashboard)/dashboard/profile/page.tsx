"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Mail, Phone, User, Calendar, Shield, Edit2, Save, X } from "lucide-react"

export default function ProfilePage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  })
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      await refreshUserProfile()
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      })
    }
    setIsEditing(false)
  }

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  const formatAccountNumber = (accountNumber: string) => {
    return accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")
  }

  const getKycStatusColor = (status: string) => {
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

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A3D62] border-t-transparent"></div>
          <span className="text-lg text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information and settings</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#0A3D62] hover:bg-[#0F5585]">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="bg-[#0A3D62] hover:bg-[#0F5585]">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-[#0A3D62] to-[#0F5585] text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white/20">
                <AvatarImage src={profile.profile_pic || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">{getInitials()}</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white text-[#0A3D62] hover:bg-gray-100"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-blue-100 mb-4">{profile.email}</p>
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <div>
                  <span className="text-blue-200">Account Number:</span>
                  <span className="font-mono ml-2">{formatAccountNumber(profile.account_number)}</span>
                </div>
                <div>
                  <span className="text-blue-200">Member since:</span>
                  <span className="ml-2">{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 rounded-md">{profile.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 rounded-md">{profile.last_name}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="flex-1 p-2 bg-gray-50 rounded-md text-gray-500">{profile.email}</p>
                <Badge variant={profile.email_verified ? "default" : "secondary"}>
                  {profile.email_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="flex-1 p-2 bg-gray-50 rounded-md">{profile.phone || "Not provided"}</p>
                  <Badge variant={profile.phone_verified ? "default" : "secondary"}>
                    {profile.phone_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>Your verification and security status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-gray-600">Verify your email address</p>
                </div>
              </div>
              <Badge variant={profile.email_verified ? "default" : "secondary"}>
                {profile.email_verified ? "Verified" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Phone Verification</p>
                  <p className="text-sm text-gray-600">Verify your phone number</p>
                </div>
              </div>
              <Badge variant={profile.phone_verified ? "default" : "secondary"}>
                {profile.phone_verified ? "Verified" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">KYC Verification</p>
                  <p className="text-sm text-gray-600">Complete identity verification</p>
                </div>
              </div>
              <Badge className={getKycStatusColor(profile.kyc_status)}>
                {profile.kyc_status === "approved"
                  ? "Verified"
                  : profile.kyc_status === "pending"
                    ? "Pending"
                    : profile.kyc_status === "rejected"
                      ? "Rejected"
                      : "Not Started"}
              </Badge>
            </div>

            {profile.kyc_status !== "approved" && (
              <Button asChild className="w-full bg-[#0A3D62] hover:bg-[#0F5585]">
                <a href="/dashboard/kyc">Complete KYC Verification</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Account Details
          </CardTitle>
          <CardDescription>Important account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Account Balance</p>
              <p className="text-2xl font-bold text-[#0A3D62]">${profile.balance?.toLocaleString() || "0.00"}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Account Type</p>
              <p className="text-lg font-semibold text-green-700">Savings Account</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Account Status</p>
              <p className="text-lg font-semibold text-purple-700">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
