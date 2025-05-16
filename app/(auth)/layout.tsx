"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider } from "@/lib/auth-provider"
import { useSession } from "@/components/client-providers"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session) {
      router.push("/dashboard")
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        {children}
      </div>
    </AuthProvider>
  )
}
