"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { useState } from "react"

export function HomepageFooter() {
  const [logoError, setLogoError] = useState(false)

  return (
    <footer className="bg-[#0A3D62] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              {logoError ? (
                <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-[#0A3D62] font-bold text-sm">
                  I&E
                </div>
              ) : (
                <Image
                  src="/images/iae-logo.png"
                  alt="I&E International Enterprise Bank Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="font-bold text-xl">I&E International Enterprise Bank</span>
            </Link>
            <p className="text-blue-200 text-sm">
              Your trusted banking partner for modern financial solutions. I&E International Enterprise Bank provides
              cutting-edge digital banking technology with personalized customer service for all your financial needs.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/iebank"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Follow I&E Bank on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/iebank"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Follow I&E Bank on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/iebank"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Follow I&E Bank on LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/iebank"
                className="text-blue-200 hover:text-white transition-colors"
                aria-label="Follow I&E Bank on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Banking Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Banking Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup" className="text-blue-200 hover:text-white transition-colors">
                  Open Savings Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-blue-200 hover:text-white transition-colors">
                  Online Banking Login
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-blue-200 hover:text-white transition-colors">
                  Money Transfer Services
                </Link>
              </li>
              <li>
                <Link href="#savings" className="text-blue-200 hover:text-white transition-colors">
                  High-Yield Savings
                </Link>
              </li>
              <li>
                <Link href="#security" className="text-blue-200 hover:text-white transition-colors">
                  Secure Banking
                </Link>
              </li>
            </ul>
          </div>

          {/* Financial Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Financial Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-blue-200">Personal Banking</span>
              </li>
              <li>
                <span className="text-blue-200">Business Banking</span>
              </li>
              <li>
                <span className="text-blue-200">Loans & Credit</span>
              </li>
              <li>
                <span className="text-blue-200">Investment Services</span>
              </li>
              <li>
                <span className="text-blue-200">Mobile Banking App</span>
              </li>
            </ul>
          </div>

          {/* Contact I&E Bank */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact I&E Bank</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-200" />
                <span className="text-blue-200">1-800-IEBANK (1-800-432-2265)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-200" />
                <span className="text-blue-200">support@iebank.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-200 mt-0.5" />
                <span className="text-blue-200">
                  I&E International Enterprise Bank
                  <br />
                  123 Banking Street
                  <br />
                  Financial District
                  <br />
                  New York, NY 10001
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-blue-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-blue-200">
              © 2024 I&E International Enterprise Bank. All rights reserved. Member FDIC.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-blue-200 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-blue-200 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-blue-200 hover:text-white transition-colors">
                Accessibility
              </Link>
              <Link href="/sitemap" className="text-blue-200 hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
