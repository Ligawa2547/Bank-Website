"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { InactivityMonitor } from "@/components/inactivity-monitor"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check authentication status after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show loading state
  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3D62]" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-100">
      <DashboardSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 w-full">
        <DashboardHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-full">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        {/* Add the InactivityMonitor component */}
        <InactivityMonitor />
      </div>
    </div>
  )
}
