// Add this at the very top of the file
export const dynamic = "force-dynamic"
;("use client")

import type React from "react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useProfile } from "@/hooks/use-profile"
import { useSupabase } from "@/providers/supabase-provider"
import { ProfilePictureUpload } from "@/components/profile-picture-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      city: "",
      country: "",
    },
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

  const handleProfilePictureUpdate = (newUrl: string) => {
    console.log("Profile picture updated:", newUrl)
    // The profile will be refreshed automatically by the upload component
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
                  <Form {...form}>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter phone number"
                                  {...field}
                                  value={formData.phoneNumber}
                                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter city"
                                  {...field}
                                  value={formData.city}
                                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter country"
                                  {...field}
                                  value={formData.country}
                                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </form>
                  </Form>
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
