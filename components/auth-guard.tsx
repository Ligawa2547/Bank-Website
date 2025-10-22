"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/providers/session-provider"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = false, redirectTo }: AuthGuardProps) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (requireAuth && !session) {
      router.push(redirectTo || "/login")
      return
    }

    if (!requireAuth && session) {
      router.push(redirectTo || "/dashboard")
      return
    }
  }, [session, isLoading, requireAuth, redirectTo, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // For auth pages (requireAuth=false), don't render if user is already logged in
  if (!requireAuth && session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // For protected pages (requireAuth=true), don't render if user is not logged in
  if (requireAuth && !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
