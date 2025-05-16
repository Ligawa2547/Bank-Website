import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/providers/supabase-provider"
import { SessionProvider } from "@/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "I&E Bank - Your Trusted Banking Partner",
  description: "Experience seamless banking with I&E Bank. Manage your accounts, transfer funds, and more.",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <SessionProvider>
              {children}
              <Toaster />
            </SessionProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
