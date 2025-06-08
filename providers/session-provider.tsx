"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()
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
  }, [supabase])

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error fetching initial session:", error)
          if (mounted) {
            setSession(null)
          }
        } else if (mounted) {
          setSession(data.session)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        if (mounted) {
          setSession(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value = {
    session,
    isLoading,
    refreshSession,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
