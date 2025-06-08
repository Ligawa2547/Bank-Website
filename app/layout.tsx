import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SessionProvider } from "@/providers/session-provider"
import { SupabaseProvider } from "@/providers/supabase-provider"
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script"
import { Suspense } from "react"
import "./globals.css"

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
      <head>
        <Script
          id="zoho-salesiq"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.$zoho=window.$zoho || {};
              $zoho.salesiq=$zoho.salesiq||{ready:function(){}};
            `,
          }}
        />
        <Script
          id="zsiqscript"
          src="https://salesiq.zohopublic.com/widget?wc=siq66028ee106f61316f5d8676b0bbe2895d4fe65333c2c5fe74e5804e401f7d931"
          strategy="afterInteractive"
          defer
        />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <Suspense
                fallback={
                  <div className="flex h-screen w-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                }
              >
                {children}
                <Toaster />
                <Analytics />
              </Suspense>
            </ThemeProvider>
          </SessionProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
