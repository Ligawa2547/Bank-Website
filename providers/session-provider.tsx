"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { Session } from "@supabase/supabase-js"

type SessionContextType = {
  session: Session | null
  isLoading: boolean
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient.auth.getSession()
      if (error) {
        console.error("Error refreshing session:", error)
        setSession(null)
      } else {
        setSession(data.session)
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
      setSession(null)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.error("Error fetching initial session:", error)
          if (mounted) {
            setSession(null)
            setIsLoading(false)
          }
        } else if (mounted) {
          setSession(data.session)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        if (mounted) {
          setSession(null)
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const value = {
    session,
    isLoading,
    refreshSession,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
