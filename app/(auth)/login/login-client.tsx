"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-provider"
import { Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react"
import Image from "next/image"

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

export default function LoginClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0)
  const router = useRouter()
  const { signIn } = useAuth()

  // Load login attempts from localStorage
  useEffect(() => {
    const attemptsData = localStorage.getItem("loginAttempts")
    const lockoutData = localStorage.getItem("loginLockout")
    
    if (attemptsData) {
      const { attempts, timestamp } = JSON.parse(attemptsData)
      const timePassed = Date.now() - timestamp
      
      if (timePassed < LOCKOUT_TIME) {
        setLoginAttempts(attempts)
      } else {
        localStorage.removeItem("loginAttempts")
        setLoginAttempts(0)
      }
    }

    if (lockoutData) {
      const lockoutTimestamp = JSON.parse(lockoutData)
      const timePassed = Date.now() - lockoutTimestamp
      
      if (timePassed < LOCKOUT_TIME) {
        setIsLocked(true)
        setLockoutTimeRemaining(LOCKOUT_TIME - timePassed)
      } else {
        localStorage.removeItem("loginLockout")
        setIsLocked(false)
      }
    }
  }, [])

  // Handle lockout timer countdown
  useEffect(() => {
    if (!isLocked) return

    const interval = setInterval(() => {
      setLockoutTimeRemaining((prev) => {
        if (prev <= 1000) {
          setIsLocked(false)
          setLoginAttempts(0)
          localStorage.removeItem("loginAttempts")
          localStorage.removeItem("loginLockout")
          clearInterval(interval)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLocked])

  const getErrorMessage = (errorMessage: string): string => {
    const lowerError = errorMessage.toLowerCase()

    // Email not confirmed
    if (lowerError.includes("email not confirmed") || lowerError.includes("email_not_confirmed")) {
      return "Your email has not been confirmed yet. Please check your mailbox for a verification link and confirm your email before signing in."
    }

    // Invalid credentials - detect if user exists
    if (lowerError.includes("invalid login credentials") || lowerError.includes("invalid_credentials")) {
      return "The email or password you entered is incorrect. Please try again."
    }

    // User doesn't exist
    if (lowerError.includes("user not found") || lowerError.includes("user_not_found")) {
      return "No account found with this email address. Please sign up to create a new account."
    }

    // Generic Supabase auth error
    if (lowerError.includes("auth")) {
      return errorMessage
    }

    return errorMessage || "An error occurred during login. Please try again."
  }

  const recordLoginAttempt = () => {
    const newAttempts = loginAttempts + 1
    const now = Date.now()

    localStorage.setItem("loginAttempts", JSON.stringify({
      attempts: newAttempts,
      timestamp: now,
    }))

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setIsLocked(true)
      setLoginAttempts(newAttempts)
      localStorage.setItem("loginLockout", JSON.stringify(now))
      setLockoutTimeRemaining(LOCKOUT_TIME)
      setError(`Too many failed login attempts. Please try again after 15 minutes.`)
      return true
    }

    setLoginAttempts(newAttempts)
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLocked) {
      setError(`Account locked. Please try again after ${Math.ceil(lockoutTimeRemaining / 1000)} seconds.`)
      return
    }

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await signIn(email, password)
      
      // Clear attempts on successful login
      localStorage.removeItem("loginAttempts")
      localStorage.removeItem("loginLockout")
      router.push("/dashboard")
    } catch (error: any) {
      const isLockout = recordLoginAttempt()
      
      if (!isLockout) {
        const displayError = getErrorMessage(error?.message || String(error))
        const attemptsRemaining = MAX_LOGIN_ATTEMPTS - loginAttempts - 1
        
        if (attemptsRemaining > 0) {
          setError(`${displayError}\n\nAttempts remaining: ${attemptsRemaining}`)
        } else {
          setError(displayError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/images/iae-logo.png" alt="IAE Bank Logo" width={80} height={80} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Alghahim Virtual Bank account to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isLocked && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your account is temporarily locked due to too many failed login attempts. Please try again after 15 minutes.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isLocked}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isLocked}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isLocked}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
              {loginAttempts > 0 && !isLocked && (
                <span className="text-xs text-orange-600 font-medium">
                  {MAX_LOGIN_ATTEMPTS - loginAttempts} attempt{MAX_LOGIN_ATTEMPTS - loginAttempts !== 1 ? "s" : ""} left
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#0A3D62] hover:bg-[#0F5585]" 
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
