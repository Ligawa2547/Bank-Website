import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/providers/supabase-provider"
import { AuthProvider } from "@/lib/auth-provider"
import { Analytics } from "@vercel/analytics/react"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "I&E National Bank - Your Trusted Banking Partner",
  description: "Experience modern banking with I&E National Bank. Secure, reliable, and innovative financial services.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              {children}
              <Toaster />
              <Analytics />
            </Suspense>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
