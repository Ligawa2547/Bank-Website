"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"

type SupabaseContext = {
  supabase: SupabaseClient | null
  user: User | null
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize Supabase client
    const initializeSupabase = async () => {
      try {
        const { createBrowserClient } = await import("@supabase/ssr")
        const client = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        setSupabase(client)

        // Get initial user
        try {
          const {
            data: { user },
            error,
          } = await client.auth.getUser()

          if (error) {
            console.warn("[v0] Supabase getUser error:", error.message)
            setUser(null)
          } else {
            setUser(user)
          }
        } catch (error) {
          console.error("[v0] Error getting user:", error instanceof Error ? error.message : String(error))
          setUser(null)
        } finally {
          setLoading(false)
        }

        // Listen for auth changes
        try {
          const {
            data: { subscription },
          } = client.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null)
          })

          return () => subscription.unsubscribe()
        } catch (error) {
          console.error("[v0] Auth state listener error:", error instanceof Error ? error.message : String(error))
          return () => {}
        }
      } catch (error) {
        console.error("[v0] Failed to initialize Supabase:", error instanceof Error ? error.message : String(error))
        setSupabase(null)
        setUser(null)
        setLoading(false)
      }
    }

    initializeSupabase()
  }, [])

  return <Context.Provider value={{ supabase, user, loading }}>{children}</Context.Provider>
}
