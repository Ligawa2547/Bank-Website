"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { InactivityMonitor } from "@/components/inactivity-monitor"
import { AuthProvider } from "@/lib/auth-provider"
import { SupabaseProvider } from "@/providers/supabase-provider"
import { SessionProvider, useSession } from "@/providers/session-provider"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login")
    }
  }, [isLoading, session, router])

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={handleSidebarClose} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <Header onMenuClick={handleMenuClick} />
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>

      {/* Inactivity Monitor */}
      <InactivityMonitor />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SupabaseProvider>
        <SessionProvider>
          <DashboardContent>{children}</DashboardContent>
        </SessionProvider>
      </SupabaseProvider>
    </AuthProvider>
  )
}
