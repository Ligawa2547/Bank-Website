import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/iae-logo.png"
                alt="AV Bank"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-xl text-[#0A3D62]">AV Bank</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
                Home
              </Link>
              <Link href="/#features" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
                Features
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
                Contact
              </Link>
            </nav>

            {/* Login Button */}
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-[#0A3D62] opacity-20 mb-4">404</h1>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h2>
            <p className="text-lg text-gray-600 mb-8">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="bg-[#8CC63F] hover:bg-[#7AB62F] text-white">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </div>

          {/* Support */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Need help? Contact our support team.
            </p>
            <Button asChild variant="ghost" className="text-[#0A5483]">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 px-4">
        <div className="container mx-auto text-center text-sm text-gray-600">
          <p>&copy; 2026 AV Bank - Alghahim Financial Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
