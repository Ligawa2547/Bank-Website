"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  address: string
  date_of_birth: string | null
  account_no: string
  account_balance: number
  balance: number
  profile_picture_url: string | null
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected"
  verification_status: "unverified" | "pending" | "verified" | "rejected"
  created_at: string
  updated_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user")
      }

      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          address,
          date_of_birth,
          account_no,
          account_balance,
          profile_picture_url,
          kyc_status,
          verification_status,
          created_at,
          updated_at
        `)
        .eq("id", user.id)
        .single()

      if (error) {
        throw error
      }

      // Map account_balance to balance for backward compatibility
      const profileData = {
        ...data,
        balance: data.account_balance || 0,
      }

      setProfile(profileData)
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return false

    try {
      setUpdating(true)

      const { error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        throw error
      }

      // Optimistically update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      return true
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
      return false
    } finally {
      setUpdating(false)
    }
  }

  const updateBalance = async (newBalance: number) => {
    if (!profile) return false

    try {
      const { error } = await supabase
        .from("users")
        .update({
          account_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (error) {
        throw error
      }

      setProfile((prev) => (prev ? { ...prev, balance: newBalance, account_balance: newBalance } : null))
      return true
    } catch (error) {
      console.error("Error updating balance:", error)
      return false
    }
  }

  const deductBalance = async (amount: number) => {
    if (!profile || profile.balance < amount) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least $${amount} to complete this transaction`,
        variant: "destructive",
      })
      return false
    }

    const newBalance = profile.balance - amount
    return await updateBalance(newBalance)
  }

  const addBalance = async (amount: number) => {
    if (!profile) return false

    const newBalance = profile.balance + amount
    return await updateBalance(newBalance)
  }

  const refreshProfile = () => {
    fetchProfile()
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    updating,
    fetchProfile,
    refreshProfile,
    updateProfile,
    updateBalance,
    deductBalance,
    addBalance,
  }
}
