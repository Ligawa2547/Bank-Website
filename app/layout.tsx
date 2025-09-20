import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "I&E National Bank - Your Trusted Banking Partner",
  description:
    "Experience secure and reliable banking services with I&E National Bank. Manage your finances, transfer money, and access banking services 24/7.",
  keywords: "banking, finance, money transfer, loans, savings, credit cards, online banking",
  authors: [{ name: "I&E National Bank" }],
  creator: "I&E National Bank",
  publisher: "I&E National Bank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "I&E National Bank - Your Trusted Banking Partner",
    description: "Experience secure and reliable banking services with I&E National Bank.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "I&E National Bank",
    images: [
      {
        url: "/images/iae-logo.png",
        width: 1200,
        height: 630,
        alt: "I&E National Bank",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "I&E National Bank - Your Trusted Banking Partner",
    description: "Experience secure and reliable banking services with I&E National Bank.",
    images: ["/images/iae-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google35bf1cdf0bb83eed",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
