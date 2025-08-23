import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "I&E National Bank - Your Trusted Banking Partner",
    template: "%s | I&E National Bank",
  },
  description:
    "I&E National Bank offers comprehensive banking services including personal banking, business banking, loans, savings accounts, and digital banking solutions. Bank with confidence and security.",
  keywords: [
    "banking",
    "personal banking",
    "business banking",
    "loans",
    "savings",
    "digital banking",
    "online banking",
    "mobile banking",
    "financial services",
    "Nigeria bank",
    "I&E National Bank",
  ],
  authors: [{ name: "I&E National Bank" }],
  creator: "I&E National Bank",
  publisher: "I&E National Bank",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://iaenb.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://iaenb.com",
    title: "I&E National Bank - Your Trusted Banking Partner",
    description:
      "Comprehensive banking services with security and convenience. Personal banking, business banking, loans, and digital solutions.",
    siteName: "I&E National Bank",
    images: [
      {
        url: "/images/bank-building.jpeg",
        width: 1200,
        height: 630,
        alt: "I&E National Bank Building",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I&E National Bank - Your Trusted Banking Partner",
    description: "Comprehensive banking services with security and convenience.",
    images: ["/images/bank-building.jpeg"],
    creator: "@iaenationalbank",
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
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/iae-logo.png" />
        <meta name="theme-color" content="#0A3D62" />
        <meta name="msapplication-TileColor" content="#0A3D62" />
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
