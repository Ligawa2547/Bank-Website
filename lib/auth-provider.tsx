"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import type { UserProfile } from "@/types/user"

/* -----------------------------------------------------------------------------
 * Supabase (client-side, singleton)
 * -------------------------------------------------------------------------- */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/* -----------------------------------------------------------------------------
 * Small in-memory cache for user profiles (avoids redundant XHR in RSC)
 * -------------------------------------------------------------------------- */
const PROFILE_CACHE_TTL = 30_000 // 30 s
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>()

/* -----------------------------------------------------------------------------
 * AuthContext 🚀
 * -------------------------------------------------------------------------- */
type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  refreshUserProfile: () => Promise<void>
  /* auth helpers */
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithMagicLink: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* -----------------------------------------------------------------------------
 * Provider 🧩
 * -------------------------------------------------------------------------- */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /* --------------------- fetch profile helper --------------------- */
  const fetchUserProfile = useCallback(async (userId: string) => {
    /* hit cache first */
    const cached = profileCache.get(userId)
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
      return cached.profile
    }

    const { data, error } = await supabase
      .from("users")
      .select(
        `
          id,
          email,
          first_name,
          last_name,
          phone_number,
          city,
          country,
          account_no,
          account_balance,
          profile_pic,
          status,
          created_at,
          updated_at,
          email_verified,
          phone_verified,
          kyc_status
        `,
      )
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching profile:", error)
      return null
    }

    if (!data) {
      /* brand-new account (e.g. fresh admin) – no row yet */
      return null
    }

    /* normalise balance */
    const balance =
      typeof data.account_balance === "number"
        ? data.account_balance
        : Number.parseFloat(data.account_balance ?? "0") || 0

    const processed: UserProfile = {
      id: data.id,
      user_id: data.id,
      email: data.email ?? "",
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      phone_number: data.phone_number ?? "",
      city: data.city ?? "",
      country: data.country ?? "",
      account_number: data.account_no ?? "",
      balance,
      profile_pic: data.profile_pic ?? "",
      status: data.status ?? "pending",
      email_verified: !!data.email_verified,
      phone_verified: !!data.phone_verified,
      kyc_status: data.kyc_status ?? "not_submitted",
      created_at: data.created_at ?? "",
      updated_at: data.updated_at ?? "",
    }

    profileCache.set(userId, { profile: processed, timestamp: Date.now() })
    return processed
  }, [])

  /* --------------------- expose manual refresh ------------------- */
  const refreshUserProfile = useCallback(async () => {
    if (!user) return
    profileCache.delete(user.id)
    const fresh = await fetchUserProfile(user.id)
    setProfile(fresh)
  }, [user, fetchUserProfile])

  /* --------------------- initialise session ---------------------- */
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) console.error(error)

      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const prof = await fetchUserProfile(session.user.id)
        if (isMounted) setProfile(prof)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    }

    init()

    /* auth listener */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (sess?.user) fetchUserProfile(sess.user.id).then(setProfile)
      else setProfile(null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  /* --------------------- auth helpers ---------------------------- */
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    profileCache.clear()
    /* redirect to generic login preserving current path for potential return */
    router.push(`/login?next=${encodeURIComponent(pathname)}`)
  }

  /* --------------------- context value --------------------------- */
  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    refreshUserProfile,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* -----------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
