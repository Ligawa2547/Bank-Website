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

        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, email, phone, phone_number, profile_picture, account_no, account_number, balance, created_at, updated_at")
          .eq("user_id", user.id)
          .maybeSingle()

        if (profileError) throw profileError

        setProfile({
          id: user.id,
          ...profileData,
          avatar_url: profileData?.profile_picture,
          account_balance: profileData?.balance ? Number(profileData.balance) : undefined,
        } as Profile)
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

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id)

      if (profileError) {
        throw profileError
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

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, email, phone, phone_number, profile_picture, account_no, account_number, balance, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError) throw profileError

      setProfile({
        id: user.id,
        ...profileData,
        avatar_url: profileData?.profile_picture,
        account_balance: profileData?.balance ? Number(profileData.balance) : undefined,
      } as Profile)
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
