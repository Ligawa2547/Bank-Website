"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import { AuthProvider } from "@/lib/auth-provider"
import { useSession } from "@/providers/session-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login")
    }
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AuthProvider>
      <div className="flex h-screen flex-col md:flex-row">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
        <InactivityMonitor timeout={15} />
      </div>
    </AuthProvider>
  )
}
