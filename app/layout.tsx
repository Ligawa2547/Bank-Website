import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IAE Bank - Your Trusted Banking Partner",
  description: "Experience modern banking with IAE Bank. Secure, reliable, and innovative financial services.",
  keywords: "banking, finance, loans, savings, transfers, IAE Bank",
  authors: [{ name: "IAE Bank" }],
  creator: "IAE Bank",
  publisher: "IAE Bank",
  robots: "index, follow",
  openGraph: {
    title: "IAE Bank - Your Trusted Banking Partner",
    description: "Experience modern banking with IAE Bank. Secure, reliable, and innovative financial services.",
    url: "https://iaebank.com",
    siteName: "IAE Bank",
    images: [
      {
        url: "/images/iae-logo.png",
        width: 1200,
        height: 630,
        alt: "IAE Bank Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IAE Bank - Your Trusted Banking Partner",
    description: "Experience modern banking with IAE Bank. Secure, reliable, and innovative financial services.",
    images: ["/images/iae-logo.png"],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/iae-logo.png" />
        <meta name="theme-color" content="#1e40af" />
        <script
          src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,hosted-fields&enable-funding=venmo,paylater,card&disable-funding=credit`}
          async
        />
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
