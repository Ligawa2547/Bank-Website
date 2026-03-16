'use client'

import Image from 'next/image'
import { Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

interface MaintenancePageProps {
  message?: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
}

export function MaintenancePage({ 
  message = 'System Maintenance',
  scheduledStart,
  scheduledEnd
}: MaintenancePageProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    timeLeft: string
    duration: string
  } | null>(null)

  useEffect(() => {
    const updateCountdown = () => {
      if (scheduledStart && scheduledEnd) {
        const now = new Date()
        const start = new Date(scheduledStart)
        const end = new Date(scheduledEnd)

        // Calculate time until maintenance ends
        const timeLeftMs = end.getTime() - now.getTime()
        
        // Calculate duration
        const durationMs = end.getTime() - start.getTime()

        if (timeLeftMs > 0) {
          const hours = Math.floor(timeLeftMs / (1000 * 60 * 60))
          const mins = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
          const secs = Math.floor((timeLeftMs % (1000 * 60)) / 1000)

          const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
          const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

          setTimeRemaining({
            timeLeft: `${hours}h ${mins}m ${secs}s`,
            duration: `${durationHours}h ${durationMins}m`,
          })
        }
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [scheduledStart, scheduledEnd])

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

        {/* Countdown Info */}
        {timeRemaining && (
          <div className="mb-8 rounded-lg bg-slate-700/50 p-6 border border-yellow-500/30">
            <div className="mb-4">
              <p className="text-sm text-slate-300 mb-1">
                <strong>Estimated Time Remaining:</strong>
              </p>
              <p className="text-4xl font-bold text-yellow-400 font-mono">
                {timeRemaining.timeLeft}
              </p>
            </div>
            <div className="border-t border-slate-600 pt-4">
              <p className="text-sm text-slate-200">
                <strong>Maintenance Duration:</strong> {timeRemaining.duration}
              </p>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mb-8 rounded-lg bg-slate-700/50 p-4">
          <p className="text-sm text-slate-200">
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
