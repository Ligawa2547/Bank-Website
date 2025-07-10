"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export function HomepageHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logoError ? (
              <div className="h-8 w-8 bg-[#0A3D62] rounded-md flex items-center justify-center text-white font-bold text-sm">
                I&E
              </div>
            ) : (
              <Image
                src="/images/iae-logo.png"
                alt="I&E National Bank"
                width={32}
                height={32}
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="font-bold text-xl text-[#0A3D62]">I&E National Bank</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
              Features
            </Link>
            <Link href="#savings" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
              Savings
            </Link>
            <Link href="#security" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
              Security
            </Link>
            <Link href="#support" className="text-gray-600 hover:text-[#0A3D62] transition-colors">
              Support
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-[#0A3D62] hover:bg-[#0F7AB3]">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#features"
                className="text-gray-600 hover:text-[#0A3D62] transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#savings"
                className="text-gray-600 hover:text-[#0A3D62] transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Savings
              </Link>
              <Link
                href="#security"
                className="text-gray-600 hover:text-[#0A3D62] transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Security
              </Link>
              <Link
                href="#support"
                className="text-gray-600 hover:text-[#0A3D62] transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-[#0A3D62] hover:bg-[#0F7AB3]">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
