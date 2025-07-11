"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/providers/supabase-provider"
import { useAuth } from "@/lib/auth-provider"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  city?: string
  country?: string
  account_number?: string
  profile_pic?: string
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  const refreshUserProfile = async () => {
    await fetchProfile()
  }

  return {
    profile,
    loading,
    refreshUserProfile,
  }
}
