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

// Inactivity timeout in milliseconds (2 minutes)
const INACTIVITY_TIMEOUT = 2 * 60 * 1000
// Warning before timeout (30 seconds before logout)
const WARNING_BEFORE_TIMEOUT = 30 * 1000

export function InactivityMonitor() {
  const { signOut, user } = useAuth()
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    // Hide warning if it's showing
    setShowWarning(false)

    // Only set new timeouts if user is logged in
    if (user) {
      // Set warning timeout
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true)
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_TIMEOUT)

      // Set logout timeout
      timeoutRef.current = setTimeout(() => {
        handleLogout()
      }, INACTIVITY_TIMEOUT)
    }
  }

  const handleLogout = async () => {
    setShowWarning(false)
    await signOut()
    router.push("/login")
  }

  useEffect(() => {
    // Only monitor activity if user is logged in
    if (!user) return

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
  }, [user])

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
