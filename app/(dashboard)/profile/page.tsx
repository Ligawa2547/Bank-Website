"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, User } from "lucide-react"

export default function ProfilePage() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    city: "",
    country: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone_number: profile.phone_number || "",
        city: profile.city || "",
        country: profile.country || "",
      })
    }
  }, [profile])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required"
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone_number: formData.phone_number.trim(),
          city: formData.city.trim() || null,
          country: formData.country.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.id)

      if (error) {
        throw error
      }

      await refreshUserProfile()
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      const response = await fetch("/api/upload-profile-picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await response.json()

      // Update profile with new picture URL
      const { error } = await supabase
        .from("user_profiles")
        .update({
          profile_pic: url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) {
        throw error
      }

      await refreshUserProfile()
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated.",
      })
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_pic || ""} alt="Profile picture" />
              <AvatarFallback className="text-lg">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="profile-picture" className="cursor-pointer">
                <div className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{isUploading ? "Uploading..." : "Upload Photo"}</span>
                </div>
              </Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                disabled={isUploading}
                className="hidden"
              />
              <p className="text-xs text-gray-500 text-center">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="Enter your first name"
                    className={errors.first_name ? "border-red-500" : ""}
                  />
                  {errors.first_name && <p className="text-sm text-red-500">{errors.first_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Enter your last name"
                    className={errors.last_name ? "border-red-500" : ""}
                  />
                  {errors.last_name && <p className="text-sm text-red-500">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  placeholder="Enter your phone number"
                  className={errors.phone_number ? "border-red-500" : ""}
                />
                {errors.phone_number && <p className="text-sm text-red-500">{errors.phone_number}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter your city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Enter your country"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Email Address</Label>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{profile.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Account Number</Label>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{profile.account_number}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Account Status</Label>
              <p className="text-sm bg-gray-50 p-2 rounded capitalize">{profile.status}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">KYC Status</Label>
              <p className="text-sm bg-gray-50 p-2 rounded capitalize">{profile.kyc_status.replace("_", " ")}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Email Verified</Label>
              <p className="text-sm bg-gray-50 p-2 rounded">{profile.email_verified ? "Yes" : "No"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Phone Verified</Label>
              <p className="text-sm bg-gray-50 p-2 rounded">{profile.phone_verified ? "Yes" : "No"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
