"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSession } from "@/providers/session-provider"

interface UserData {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  city?: string
  country?: string
  account_no?: string
  account_balance?: number
  status?: string
  created_at?: string
  updated_at?: string
  email_verified?: boolean
  phone_verified?: boolean
  kyc_status?: string
}

export default function ProfileClient() {
  const { session } = useSession()
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

  // Function to get status display information
  const getStatusInfo = useCallback((status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return {
          color: "text-green-600",
          bgColor: "bg-green-500",
          label: "Active",
        }
      case "inactive":
        return {
          color: "text-red-600",
          bgColor: "bg-red-500",
          label: "Inactive",
        }
      case "suspended":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-500",
          label: "Suspended",
        }
      case "pending":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-500",
          label: "Pending",
        }
      case "closed":
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-500",
          label: "Closed",
        }
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-500",
          label: "Unknown",
        }
    }
  }, [])

  // Fetch user data from the public.users table
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        console.log("No session or user ID available")
        setIsFetching(false)
        return
      }

      try {
        setIsFetching(true)

        // Use a more efficient query with only the fields we need
        const { data, error } = await supabase
          .from("users")
          .select(`
          id, 
          email, 
          first_name, 
          last_name, 
          phone_number, 
          city, 
          country, 
          account_no, 
          account_balance, 
          status, 
          created_at, 
          updated_at, 
          email_verified, 
          phone_verified, 
          kyc_status
        `)
          .eq("id", session.user.id)
          .maybeSingle()

        if (error) {
          console.error("Error fetching user data from public.users:", error)
          toast({
            title: "Error",
            description: "Failed to load profile data. Please try again.",
            variant: "destructive",
          })
          return
        }

        if (data) {
          setUserData(data)
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || session.user.email || "",
            phone_number: data.phone_number || "",
            city: data.city || "",
            country: data.country || "",
          })
        } else {
          // Set default data with auth user email
          setFormData({
            first_name: "",
            last_name: "",
            email: session.user.email || "",
            phone_number: "",
            city: "",
            country: "",
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading your profile.",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserData()
  }, [session?.user?.id, supabase, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      console.log("Updating user data in public.users for ID:", session.user.id)

      // Check if user exists in public.users table
      const { data: existingUser } = await supabase.from("users").select("id").eq("id", session.user.id).maybeSingle()

      let result
      if (existingUser) {
        // Update existing user
        result = await supabase
          .from("users")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            city: formData.city,
            country: formData.country,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.user.id)
          .select()
          .single()
      } else {
        // Insert new user record
        result = await supabase
          .from("users")
          .insert({
            id: session.user.id,
            email: session.user.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            city: formData.city,
            country: formData.country,
            status: "pending", // Default status for new users
            account_balance: 0, // Default balance
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      }

      if (result.error) {
        console.error("Error updating/inserting user data:", result.error)
        throw result.error
      }

      // Update local state with the returned data
      if (result.data) {
        setUserData(result.data)
        console.log("Profile updated successfully in public.users")
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      setIsEditing(false)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "There was an error updating your profile. Please try again.",
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

  const statusInfo = getStatusInfo(userData?.status)

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>

      {/* Personal Information Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 mb-6">
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
                  placeholder="Enter your first name"
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
                  placeholder="Enter your last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="bg-gray-50 dark:bg-gray-900"
                />
                <p className="text-xs text-gray-500">Email cannot be changed from this page</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Enter your country"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      // Reset form data to original values
                      setFormData({
                        first_name: userData?.first_name || "",
                        last_name: userData?.last_name || "",
                        email: userData?.email || session?.user?.email || "",
                        phone_number: userData?.phone_number || "",
                        city: userData?.city || "",
                        country: userData?.country || "",
                      })
                    }}
                    disabled={isLoading}
                  >
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
      </div>

      {/* Account Information Card */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Account Information</h3>
              <p className="text-sm text-gray-500">View your banking account details from public.users table.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Account Number</p>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-lg font-semibold text-blue-600">
                  {userData?.account_no || "Not assigned"}
                </p>
                {userData?.account_no && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(userData.account_no || "")
                      toast({
                        title: "Copied!",
                        description: "Account number copied to clipboard.",
                      })
                    }}
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Account Balance</p>
              <p className="text-lg font-semibold text-green-600">
                ${typeof userData?.account_balance === "number" ? userData.account_balance.toFixed(2) : "0.00"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <div className="flex items-center">
                <div className={`mr-2 h-2 w-2 rounded-full ${statusInfo.bgColor}`}></div>
                <p className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-sm">
                {userData?.created_at
                  ? new Date(userData.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not available"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Email Verification</p>
              <div className="flex items-center">
                <div
                  className={`mr-2 h-2 w-2 rounded-full ${userData?.email_verified ? "bg-green-500" : "bg-yellow-500"}`}
                ></div>
                <p className={`font-medium ${userData?.email_verified ? "text-green-600" : "text-yellow-600"}`}>
                  {userData?.email_verified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Phone Verification</p>
              <div className="flex items-center">
                <div
                  className={`mr-2 h-2 w-2 rounded-full ${userData?.phone_verified ? "bg-green-500" : "bg-yellow-500"}`}
                ></div>
                <p className={`font-medium ${userData?.phone_verified ? "text-green-600" : "text-yellow-600"}`}>
                  {userData?.phone_verified ? "Verified" : "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
