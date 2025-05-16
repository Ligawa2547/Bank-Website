"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ProfileClient() {
  const { user, profile, refreshUserProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || user?.email || "",
    phone_number: profile?.phone_number || "",
    city: profile?.city || "",
    country: profile?.country || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      // Try to update user_profiles first
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          city: formData.city,
          country: formData.country,
        })
        .eq("user_id", user.id)

      // If no rows were affected, try updating the users table
      if (profileError) {
        console.log("Error updating user_profiles or no rows affected, trying users table")
        const { error: userError } = await supabase
          .from("users")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            city: formData.city,
            country: formData.country,
          })
          .eq("id", user.id)

        if (userError) {
          throw userError
        }
      }

      // Refresh the profile data
      await refreshUserProfile()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile && !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading profile...</h2>
          <p className="text-sm text-gray-500">Please wait while we load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium">Personal Information</h2>
            <p className="text-sm text-gray-500">Update your personal details here.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} disabled={true} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </div>
        <div className="border-t border-gray-200 p-6 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <p className="text-sm text-gray-500">View your account details.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Account Number</p>
              <p className="font-mono text-lg">{profile?.account_number || "Not available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                <p>Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
