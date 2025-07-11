import type React from "react"
import { AuthProvider } from "@/lib/auth-provider"
import { AuthGuard } from "@/components/auth-guard"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AuthGuard requireAuth={false} redirectTo="/dashboard">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </AuthGuard>
    </AuthProvider>
  )
}
