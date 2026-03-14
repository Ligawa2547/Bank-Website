import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { FloatingChat } from "@/components/floating-chat"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Alghahim Virtual Bank - Your Trusted Banking Partner",
  description:
    "Experience secure and convenient banking with Alghahim Virtual Bank. Manage your finances, transfer money, and access banking services 24/7.",
  keywords: "banking, finance, money transfer, savings, loans, credit cards, online banking",
  authors: [{ name: "Alghahim Virtual Bank" }],
  creator: "Alghahim Virtual Bank",
  publisher: "Alghahim Virtual Bank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://alghahim-bank.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Alghahim Virtual Bank - Your Trusted Banking Partner",
    description:
      "Experience secure and convenient banking with Alghahim Virtual Bank. Manage your finances, transfer money, and access banking services 24/7.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://alghahim-bank.vercel.app",
    siteName: "Alghahim Virtual Bank",
    images: [
      {
        url: "/images/iae-logo.png",
        width: 1200,
        height: 630,
        alt: "Alghahim Virtual Bank Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alghahim Virtual Bank - Your Trusted Banking Partner",
    description:
      "Experience secure and convenient banking with Alghahim Virtual Bank. Manage your finances, transfer money, and access banking services 24/7.",
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
    google: "35bf1cdf0bb83eed",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/iae-logo.png" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
          <Analytics />
          <FloatingChat />
        </Providers>
      </body>
    </html>
  )
}
