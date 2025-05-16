"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session, SupabaseClient } from "@supabase/supabase-js"

type SessionContextType = {
  session: Session | null
  supabase: SupabaseClient
  isLoading: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error fetching session:", error)
      }
      setSession(data.session)
      setIsLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return <SessionContext.Provider value={{ session, supabase, isLoading }}>{children}</SessionContext.Provider>
}
