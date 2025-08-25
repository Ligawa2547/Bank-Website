"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AuthProvider } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/admin/login")
          return
        }

        // Check if user email is from iaenb.com domain
        const email = session.user.email
        if (!email || !email.endsWith("@iaenb.com")) {
          await supabase.auth.signOut()
          router.push("/admin/login")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("Error checking admin access:", error)
        router.push("/admin/login")
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden bg-red-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logoError ? (
              <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-red-900 font-bold text-sm">
                I&E
              </div>
            ) : (
              <Image
                src="/images/iae-logo.png"
                alt="I&E National Bank"
                width={32}
                height={32}
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="font-bold text-lg">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-red-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <AdminSidebar />
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
              <div className="fixed left-0 top-0 h-full w-64 bg-red-900">
                <AdminSidebar />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Desktop Header */}
            <div className="hidden lg:block">
              <AdminHeader />
            </div>

            {/* Mobile-friendly main content */}
            <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
