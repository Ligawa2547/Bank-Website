"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface UserData {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  city?: string
  country?: string
  account_no?: string
  balance?: number
}

export default function ProfileClient() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    city: "",
    country: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Fetch user data from the users table
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        setIsFetching(true)
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching user data:", error)
          return
        }

        setUserData(data)
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || user.email || "",
          phone_number: data.phone_number || "",
          city: data.city || "",
          country: data.country || "",
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserData()
  }, [user, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      // Update the users table
      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          city: formData.city,
          country: formData.country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      // Update local state
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone_number: formData.phone_number,
              city: formData.city,
              country: formData.country,
            }
          : null,
      )

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

  if (isFetching) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-lg font-medium">Loading profile...</h2>
          <p className="text-sm text-gray-500">Please wait while we load your profile information.</p>
        </div>
      </div>
    )
  }

  if (!userData && !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium">Profile not found</h2>
          <p className="text-sm text-gray-500">Unable to load your profile information.</p>
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
              <p className="font-mono text-lg font-semibold">{userData?.account_no || "Not available"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Balance</p>
              <p className="text-lg font-semibold text-green-600">${userData?.balance?.toFixed(2) || "0.00"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-green-600 font-medium">Active</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-sm">
                {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : "Not available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
