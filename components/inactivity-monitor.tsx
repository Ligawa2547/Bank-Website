"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Inactivity timeout in milliseconds (15 minutes)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000
// Warning before timeout (30 seconds before logout)
const WARNING_BEFORE_TIMEOUT = 30 * 1000

interface InactivityMonitorProps {
  timeout?: number // timeout in minutes
}

export function InactivityMonitor({ timeout = 15 }: InactivityMonitorProps) {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const auth = useAuth()
  const user = auth.user
  const signOut = auth.signOut

  const actualTimeout = timeout * 60 * 1000 // Convert minutes to milliseconds

  const resetTimer = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Hide warning if it's showing
    setShowWarning(false)

    // Only set new timeouts if user is logged in
    if (user && signOut) {
      // Set warning timeout
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true)
      }, actualTimeout - WARNING_BEFORE_TIMEOUT)

      // Set logout timeout
      timeoutRef.current = setTimeout(() => {
        handleLogout()
      }, actualTimeout)
    }
  }

  const handleLogout = async () => {
    setShowWarning(false)
    if (signOut) {
      await signOut()
    } else {
      router.push("/login")
    }
  }

  useEffect(() => {
    // Only monitor activity if user is logged in and signOut is available
    if (!user || !signOut) return

    // Set initial timer
    resetTimer()

    // Events to monitor for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Add event listeners
    const resetTimerBound = resetTimer.bind(this)
    events.forEach((event) => {
      document.addEventListener(event, resetTimerBound)
    })

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach((event) => {
        document.removeEventListener(event, resetTimerBound)
      })

      // Clear timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [user, signOut, actualTimeout])

  // Don't render anything if auth is not available
  if (!user || !signOut) {
    return null
  }

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session is about to expire due to inactivity. You will be automatically logged out in 30 seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={resetTimer}>Stay Logged In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
