"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { useSupabase } from "@/providers/supabase-provider"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const ProfilePage = () => {
  const router = useRouter()
  const { supabase } = useSupabase()
  const { data: session } = useSession()
  const user = session?.user
  const { profile, refreshUserProfile } = useProfile()

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: "",
    city: "",
    country: "",
  })

  const [errors, setErrors] = useState({
    phoneNumber: "",
    city: "",
    country: "",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        phoneNumber: profile.phone_number || "",
        city: profile.city || "",
        country: profile.country || "",
      })
    }
  }, [profile])

  const validateForm = () => {
    const newErrors = {
      phoneNumber: "",
      city: "",
      country: "",
    }

    // Basic validation
    if (formData.phoneNumber && !/^\+?[\d\s\-$$$$]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number"
    }

    if (formData.city && formData.city.length < 2) {
      newErrors.city = "City must be at least 2 characters"
    }

    if (formData.country && formData.country.length < 2) {
      newErrors.country = "Country must be at least 2 characters"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

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

  const handleProfilePictureUpdate = (newUrl: string) => {
    console.log("Profile picture updated:", newUrl)
    // The profile will be refreshed automatically by the upload component
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Picture Section */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a profile picture to personalize your account</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProfilePictureUpload currentImageUrl={profile?.profile_pic} onImageUpdate={handleProfilePictureUpdate} />
            </CardContent>
          </Card>

          {/* Profile Information Section */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-6">
                  {/* Read-only fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900">
                        {profile.first_name || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900">
                        {profile.last_name || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900">
                        {profile.email || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Number</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-gray-900 font-mono">
                        {profile.account_number || "Not assigned"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Editable fields */}
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <Input
                          id="phoneNumber"
                          placeholder="Enter phone number"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          disabled={!isEditing}
                          className={errors.phoneNumber ? "border-red-500" : ""}
                        />
                        {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
                      </div>
                      <div>
                        <label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City
                        </label>
                        <Input
                          id="city"
                          placeholder="Enter city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          disabled={!isEditing}
                          className={errors.city ? "border-red-500" : ""}
                        />
                        {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label htmlFor="country" className="text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <Input
                          id="country"
                          placeholder="Enter country"
                          value={formData.country}
                          onChange={(e) => handleInputChange("country", e.target.value)}
                          disabled={!isEditing}
                          className={errors.country ? "border-red-500" : ""}
                        />
                        {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {!isEditing ? (
                        <Button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="bg-[#0A3D62] text-white hover:bg-[#0F5585]"
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isLoading ? "Updating..." : "Save Changes"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false)
                              setErrors({ phoneNumber: "", city: "", country: "" })
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
                  <span className="ml-2">Loading profile...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
