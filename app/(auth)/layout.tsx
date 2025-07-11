import type React from "react"
import { AuthProvider } from "@/lib/auth-provider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">{children}</div>
    </AuthProvider>
  )
}
