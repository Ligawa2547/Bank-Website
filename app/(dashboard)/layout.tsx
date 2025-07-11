"use client"

import type React from "react"
import { SessionProvider } from "@/providers/session-provider"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { InactivityMonitor } from "@/components/inactivity-monitor"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AuthGuard requireAuth>
        <div className="min-h-screen bg-gray-50">
          <DashboardSidebar />
          <div className="lg:pl-64">
            <DashboardHeader />
            <main className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
          </div>
          <InactivityMonitor />
        </div>
      </AuthGuard>
    </SessionProvider>
  )
}
