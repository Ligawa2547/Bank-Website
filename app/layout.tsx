import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "IAE Bank - Secure Online Banking",
    template: "%s | IAE Bank",
  },
  description:
    "Experience secure and convenient online banking with IAE Bank. Manage your accounts, transfer funds, pay bills, and access financial services 24/7.",
  keywords: [
    "online banking",
    "digital banking",
    "secure banking",
    "IAE Bank",
    "financial services",
    "money transfer",
    "account management",
    "mobile banking",
    "internet banking",
    "bank account",
    "savings account",
    "checking account",
    "loans",
    "credit cards",
  ],
  authors: [{ name: "IAE Bank" }],
  creator: "IAE Bank",
  publisher: "IAE Bank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ebanking.iaenb.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ebanking.iaenb.com",
    title: "IAE Bank - Secure Online Banking",
    description:
      "Experience secure and convenient online banking with IAE Bank. Manage your accounts, transfer funds, pay bills, and access financial services 24/7.",
    siteName: "IAE Bank",
    images: [
      {
        url: "/images/iae-logo.png",
        width: 1200,
        height: 630,
        alt: "IAE Bank Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IAE Bank - Secure Online Banking",
    description:
      "Experience secure and convenient online banking with IAE Bank. Manage your accounts, transfer funds, pay bills, and access financial services 24/7.",
    images: ["/images/iae-logo.png"],
    creator: "@iaebank",
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
  category: "finance",
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
        <meta name="google-site-verification" content="google35bf1cdf0bb83eed" />
        <link rel="canonical" href="https://ebanking.iaenb.com" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/iae-logo.png" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
