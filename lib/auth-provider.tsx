"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, usePathname } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import type { UserProfile } from "@/types/user"

type AuthContextType = {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  refreshUserProfile: () => Promise<void>
  signUp: (email: string, password: string) => Promise<{ data?: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithMagicLink: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Function to fetch user profile data from public.users table
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for user ID:", userId)

      // Fetch directly from public.users table using maybeSingle() to handle no rows gracefully
      const { data: userData, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

      if (error) {
        console.error("Error fetching user data:", error)
        return null
      }

      if (userData) {
        console.log("User data found in public.users table:", userData)

        // Convert users table format to UserProfile format
        const userProfile: UserProfile = {
          id: userData.id,
          user_id: userData.id,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          email: userData.email || null,
          phone_number: userData.phone_number || null,
          city: userData.city || null,
          country: userData.country || null,
          account_number: userData.account_no || null, // Use account_no from users table
          balance: userData.balance || 0,
          status: userData.status || "pending", // Include status from users table
          email_verified: userData.email_verified || false,
          phone_verified: userData.phone_verified || false,
          kyc_status: userData.kyc_status || "not_submitted",
          created_at: userData.created_at || null,
          updated_at: userData.updated_at || null,
        }

        return userProfile
      }

      console.log("No user profile found in public.users table for user ID:", userId)
      return null
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  // Function to refresh user profile data
  const refreshUserProfile = async () => {
    if (!user) {
      console.log("Cannot refresh profile: No user is logged in")
      return
    }

    try {
      console.log("Refreshing user profile for user ID:", user.id)
      const profileData = await fetchUserProfile(user.id)
      if (profileData) {
        setProfile(profileData)
        console.log("User profile refreshed successfully")
      } else {
        console.log("No profile data found during refresh")
        setProfile(null)
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      console.log("Fetching session...")

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error)
        }

        console.log("Session fetched:", session ? "Session exists" : "No session")
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          console.log("User is logged in, fetching profile from public.users table")
          // Fetch user profile from public.users table
          const profileData = await fetchUserProfile(session.user.id)
          if (profileData) {
            setProfile(profileData)
            console.log("Profile set successfully")
          } else {
            console.log("No profile data found in public.users table")
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error("Error in fetchSession:", error)
      } finally {
        setIsLoading(false)
        console.log("Session fetch completed")
      }
    }

    fetchSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session")

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        console.log("User logged in, fetching profile from public.users table on auth state change")
        // Fetch user profile when auth state changes
        const profileData = await fetchUserProfile(session.user.id)
        if (profileData) {
          setProfile(profileData)
          console.log("Profile set on auth state change")
        } else {
          console.log("No profile found in public.users table on auth state change")
          setProfile(null)
        }
      } else {
        setProfile(null)
        console.log("No user, profile set to null")
      }

      // Handle redirects based on auth state
      const isAuthRoute = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname)
      console.log("Current path:", pathname, "Is auth route:", isAuthRoute)

      if (!session && !isAuthRoute && pathname !== "/" && !pathname.includes("/auth/callback")) {
        console.log("No session, redirecting to login")
        router.push("/login")
      } else if (session && isAuthRoute) {
        console.log("Session exists on auth route, redirecting to dashboard")
        router.push("/dashboard")
      }
    })

    return () => {
      console.log("Cleaning up auth subscription")
      subscription.unsubscribe()
    }
  }, [supabase, router, pathname])

  const signUp = async (email: string, password: string) => {
    console.log("Signing up with email:", email)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Signup error:", error)
      } else {
        console.log("Signup successful:", data ? "Data exists" : "No data")
      }

      return { data, error }
    } catch (e: any) {
      console.error("Unexpected error during signup:", e)
      // Improve error message for network issues
      if (e.message?.includes("fetch") || !navigator.onLine) {
        return { error: { message: "Network connection issue. Please check your internet connection and try again." } }
      }
      return { error: { message: "An unexpected error occurred" } }
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log("Signing in with email:", email)
    let attempts = 0
    const maxAttempts = 3

    while (attempts <= maxAttempts) {
      try {
        if (attempts > 0) {
          console.log(`Auth provider retry attempt ${attempts}...`)
          // Add exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts - 1), 8000)))
        }

        // Check network connectivity
        if (!navigator.onLine) {
          throw new Error("You appear to be offline. Please check your internet connection.")
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error("Sign in error:", error)

          // Don't retry for invalid credentials
          if (error.message?.includes("Invalid login credentials") || error.message?.includes("Email not confirmed")) {
            return { error }
          }

          // For other errors, retry if we haven't reached max attempts
          if (attempts < maxAttempts) {
            attempts++
            continue
          }
        } else {
          console.log("Sign in successful:", data ? "Data exists" : "No data")
        }

        return { error }
      } catch (e: any) {
        console.error("Unexpected error during sign in:", e)

        // Improve error message for network issues
        if (e.message?.includes("fetch") || e.message?.includes("network") || !navigator.onLine) {
          if (attempts < maxAttempts) {
            attempts++
            continue
          }
          return {
            error: { message: "Network connection issue. Please check your internet connection and try again." },
          }
        }

        // Retry if we haven't reached max attempts
        if (attempts < maxAttempts) {
          attempts++
          continue
        }

        return { error: { message: e.message || "An unexpected error occurred" } }
      }
    }

    // If we've exhausted all attempts
    return { error: { message: "Failed to sign in after multiple attempts. Please try again later." } }
  }

  const signInWithMagicLink = async (email: string) => {
    console.log("Sending magic link to:", email)
    try {
      // Check network connectivity
      if (!navigator.onLine) {
        return { error: { message: "You appear to be offline. Please check your internet connection." } }
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Magic link error:", error)
      } else {
        console.log("Magic link sent successfully:", data ? "Data exists" : "No data")
      }

      return { error }
    } catch (e: any) {
      console.error("Unexpected error during magic link:", e)
      // Improve error message for network issues
      if (e.message?.includes("fetch") || !navigator.onLine) {
        return { error: { message: "Network connection issue. Please check your internet connection and try again." } }
      }
      return { error: { message: "An unexpected error occurred" } }
    }
  }

  const signOut = async () => {
    console.log("Signing out")
    try {
      await supabase.auth.signOut()
      console.log("Sign out successful")
      router.push("/login")
    } catch (e) {
      console.error("Error during sign out:", e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        refreshUserProfile,
        signUp,
        signIn,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
