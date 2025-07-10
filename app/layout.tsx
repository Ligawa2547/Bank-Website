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
  title: "I&E International Enterprise Bank - Your Trusted Banking Partner",
  description:
    "I&E International Enterprise Bank offers modern digital banking solutions. Open an account, transfer money, manage savings, and access secure online banking services. Experience seamless banking with cutting-edge technology.",
  keywords:
    "I&E Bank, International Enterprise Bank, digital banking, online banking, money transfer, savings account, secure banking, mobile banking, financial services",
  authors: [{ name: "I&E International Enterprise Bank" }],
  creator: "I&E International Enterprise Bank",
  publisher: "I&E International Enterprise Bank",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://iebank.com",
    siteName: "I&E International Enterprise Bank",
    title: "I&E International Enterprise Bank - Modern Digital Banking",
    description:
      "Experience seamless banking with I&E International Enterprise Bank. Open accounts, transfer money, and manage your finances with our secure digital platform.",
    images: [
      {
        url: "/images/iae-logo.png",
        width: 1200,
        height: 630,
        alt: "I&E International Enterprise Bank Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "I&E International Enterprise Bank - Modern Digital Banking",
    description:
      "Experience seamless banking with I&E International Enterprise Bank. Secure, fast, and reliable banking services.",
    images: ["/images/iae-logo.png"],
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
  alternates: {
    canonical: "https://iebank.com",
  },
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
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="your-google-verification-code" />

        {/* Additional SEO Meta Tags */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
        <meta name="geo.position" content="40.7128;-74.0060" />
        <meta name="ICBM" content="40.7128, -74.0060" />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              name: "I&E International Enterprise Bank",
              alternateName: "I&E Bank",
              description:
                "Modern digital banking solutions with secure online banking, money transfers, and savings accounts.",
              url: "https://iebank.com",
              logo: "https://iebank.com/images/iae-logo.png",
              image: "https://iebank.com/images/bank-building.jpeg",
              telephone: "1-800-IEBANK",
              email: "support@iebank.com",
              address: {
                "@type": "PostalAddress",
                streetAddress: "123 Banking Street",
                addressLocality: "Financial District",
                addressRegion: "NY",
                postalCode: "10001",
                addressCountry: "US",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "40.7128",
                longitude: "-74.0060",
              },
              openingHours: "Mo-Fr 09:00-17:00",
              priceRange: "Free",
              serviceType: "Digital Banking",
              areaServed: "United States",
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Banking Services",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Online Banking",
                      description: "Secure online banking platform",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Money Transfers",
                      description: "Instant money transfer services",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Savings Accounts",
                      description: "High-yield savings accounts",
                    },
                  },
                ],
              },
              sameAs: [
                "https://facebook.com/iebank",
                "https://twitter.com/iebank",
                "https://linkedin.com/company/iebank",
                "https://instagram.com/iebank",
              ],
            }),
          }}
        />

        {/* Zoho SalesIQ */}
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
