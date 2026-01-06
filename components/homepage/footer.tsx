"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { useState } from "react"

const XLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.675L2.306 21.75H-1v-3.308l7.227-8.26L-1.424 2.25h6.514l5.106 6.675L18.244 2.25zM16.874 19.269h1.828L6.288 3.922H4.382L16.874 19.269z" />
  </svg>
)

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
                  alt="I&E National Bank"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="font-bold text-xl">I&E National Bank</span>
            </Link>
            <p className="text-blue-200 text-sm">
              Your trusted banking partner for modern financial solutions. Experience seamless banking with cutting-edge
              technology and personalized service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <XLogo />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup" className="text-blue-200 hover:text-white transition-colors">
                  Open Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-blue-200 hover:text-white transition-colors">
                  Online Banking
                </Link>
              </li>
              <li>
                <Link href="#features" className="text-blue-200 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#savings" className="text-blue-200 hover:text-white transition-colors">
                  Savings
                </Link>
              </li>
              <li>
                <Link href="#security" className="text-blue-200 hover:text-white transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Services</h3>
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
                <span className="text-blue-200">Mobile Banking</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-200" />
                <span className="text-blue-200">1-800-IEBANK</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-200" />
                <span className="text-blue-200">support@iebank.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-200 mt-0.5" />
                <span className="text-blue-200">
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
            <div className="text-sm text-blue-200">© 2024 I&E National Bank. All rights reserved.</div>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
