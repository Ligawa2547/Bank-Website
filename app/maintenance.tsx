'use client'

import Image from 'next/image'
import { Wrench } from 'lucide-react'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message = 'System Maintenance' }: MaintenancePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/avb-logo.png"
            alt="AVB Logo"
            width={80}
            height={80}
            className="h-20 w-20"
          />
        </div>

        {/* Maintenance Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-yellow-100 p-4">
            <Wrench className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-3xl font-bold text-white">{message}</h1>

        {/* Description */}
        <p className="mb-6 text-lg text-slate-300">
          We're currently performing scheduled maintenance to improve your banking experience. We'll be back online shortly.
        </p>

        {/* Additional Info */}
        <div className="mb-8 rounded-lg bg-slate-700/50 p-4">
          <p className="text-sm text-slate-200">
            <strong>Estimated Duration:</strong> Less than 1 hour
          </p>
          <p className="mt-2 text-sm text-slate-200">
            For urgent assistance, please contact our support team at{' '}
            <a href="tel:+1234567890" className="text-yellow-500 hover:underline">
              support
            </a>
          </p>
        </div>

        {/* Footer */}
        <footer className="text-sm text-slate-400">
          <p>Alghahim Virtual Bank - Your Trusted Banking Partner</p>
        </footer>
      </div>
    </div>
  )
}
