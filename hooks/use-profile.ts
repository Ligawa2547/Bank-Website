"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

export type Profile = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  date_of_birth?: string
  avatar_url?: string
  account_no?: string
  account_balance?: number
  kyc_status?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export function useProfile() {
  const { user, profile: authProfile, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile as Profile)
      setLoading(false)
    } else if (user) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [user, authProfile])

  const loadProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (profileError) {
        throw profileError
      }

      setProfile(data as Profile)
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: new Error("Not authenticated") }

    try {
      setLoading(true)

      const { error: updateError } = await supabase.from("users").update(updates).eq("id", user.id)

      if (updateError) {
        throw updateError
      }

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

  return {
    profile,
    loading: loading || authLoading,
    error,
    updateProfile,
  }
}
