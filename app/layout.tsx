import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://ebanking.iaenb.com"),
  title: {
    default: "IAE Bank - Secure Online Banking",
    template: "%s | IAE Bank",
  },
  description:
    "Experience secure and convenient online banking with IAE Bank. Manage your accounts, transfer money, apply for loans, and more with our comprehensive digital banking platform.",
  keywords: [
    "online banking",
    "digital banking",
    "secure banking",
    "money transfer",
    "loans",
    "savings account",
    "IAE Bank",
    "financial services",
    "mobile banking",
  ],
  authors: [{ name: "IAE Bank" }],
  creator: "IAE Bank",
  publisher: "IAE Bank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ebanking.iaenb.com",
    siteName: "IAE Bank",
    title: "IAE Bank - Secure Online Banking",
    description:
      "Experience secure and convenient online banking with IAE Bank. Manage your accounts, transfer money, apply for loans, and more.",
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
    description: "Experience secure and convenient online banking with IAE Bank.",
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
  alternates: {
    canonical: "https://ebanking.iaenb.com",
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
      <head>
        <meta name="google-site-verification" content="google35bf1cdf0bb83eed" />
        <link rel="canonical" href="https://ebanking.iaenb.com" />
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
