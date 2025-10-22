"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/providers/supabase-provider"
import { toast } from "@/hooks/use-toast"

export type Profile = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  account_no?: string
  account_balance?: number
  created_at?: string
  updated_at?: string
}

export function useProfile() {
  const { supabase, user } = useSupabase()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Try to fetch from both tables in parallel for best data
        const [usersResponse, profilesResponse] = await Promise.all([
          supabase.from("users").select("*").eq("id", user.id).single(),
          supabase.from("user_profiles").select("*").eq("id", user.id).single(),
        ])

        // Combine data from both sources, with profiles taking precedence
        const userData = usersResponse.data || {}
        const profileData = profilesResponse.data || {}

        const combinedProfile = {
          id: user.id,
          ...userData,
          ...profileData,
        }

        setProfile(combinedProfile as Profile)
      } catch (err) {
        console.error("Error loading profile:", err)
        setError(err instanceof Error ? err : new Error("Failed to load profile"))
        toast({
          title: "Error loading profile",
          description: "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, supabase])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: new Error("Not authenticated") }

    try {
      setLoading(true)

      // Update both tables to keep them in sync
      const [usersResponse, profilesResponse] = await Promise.all([
        supabase.from("users").update(updates).eq("id", user.id),
        supabase.from("user_profiles").update(updates).eq("id", user.id),
      ])

      if (usersResponse.error && profilesResponse.error) {
        throw new Error(usersResponse.error.message || "Failed to update profile")
      }

      // Refresh profile data
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))

      return { success: true }
    } catch (err) {
      console.error("Error updating profile:", err)
      const error = err instanceof Error ? err : new Error("Failed to update profile")
      setError(error)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      const [usersResponse, profilesResponse] = await Promise.all([
        supabase.from("users").select("*").eq("id", user.id).single(),
        supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      ])

      const userData = usersResponse.data || {}
      const profileData = profilesResponse.data || {}

      const combinedProfile = {
        id: user.id,
        ...userData,
        ...profileData,
      }

      setProfile(combinedProfile as Profile)
    } catch (err) {
      console.error("Error refreshing profile:", err)
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  }
}
