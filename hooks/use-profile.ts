"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  account_no: string
  account_balance: number
  status: string
  verification_status: string
  kyc_status: string
  email_verified: boolean
  phone_verified: boolean
  profile_pic?: string
  city?: string
  country?: string
  created_at: string
  updated_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user")
      }

      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) {
        throw error
      }

      setProfile(data as UserProfile)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!profile) return false

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

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      return true
    } catch (err: any) {
      console.error("Error updating profile:", err)
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      })
      return false
    }
  }

  const deductBalance = async (amount: number, description = "KYC Fee") => {
    try {
      if (!profile) {
        throw new Error("No profile found")
      }

      if (profile.account_balance < amount) {
        throw new Error("Insufficient balance")
      }

      // Use the database function for safe balance updates
      const { error: balanceError } = await supabase.rpc("update_user_balance", {
        user_uuid: profile.id,
        amount_change: amount,
        operation_type: "debit",
      })

      if (balanceError) {
        throw balanceError
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: profile.id,
        account_no: profile.account_no,
        transaction_type: "withdrawal",
        amount: amount,
        status: "completed",
        reference: `KYC-${Date.now()}`,
        narration: description,
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Transaction record error:", transactionError)
        // Don't throw here as the balance was already updated
      }

      // Update local profile balance
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              account_balance: prev.account_balance - amount,
            }
          : null,
      )

      toast({
        title: "Payment processed",
        description: `$${amount} has been deducted from your account.`,
      })

      return true
    } catch (err: any) {
      console.error("Error deducting balance:", err)
      toast({
        title: "Payment failed",
        description: err.message,
        variant: "destructive",
      })
      return false
    }
  }

  const addBalance = async (amount: number, description = "Credit") => {
    try {
      if (!profile) {
        throw new Error("No profile found")
      }

      // Use the database function for safe balance updates
      const { error: balanceError } = await supabase.rpc("update_user_balance", {
        user_uuid: profile.id,
        amount_change: amount,
        operation_type: "credit",
      })

      if (balanceError) {
        throw balanceError
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: profile.id,
        account_no: profile.account_no,
        transaction_type: "deposit",
        amount: amount,
        status: "completed",
        reference: `DEP-${Date.now()}`,
        narration: description,
        created_at: new Date().toISOString(),
      })

      if (transactionError) {
        console.error("Transaction record error:", transactionError)
      }

      // Update local profile balance
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              account_balance: prev.account_balance + amount,
            }
          : null,
      )

      toast({
        title: "Balance updated",
        description: `$${amount} has been added to your account.`,
      })

      return true
    } catch (err: any) {
      console.error("Error adding balance:", err)
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      })
      return false
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    updateProfile,
    deductBalance,
    addBalance,
    refreshProfile,
  }
}
