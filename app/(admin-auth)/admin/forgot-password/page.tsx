"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { KeyRound, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const validateAdminEmail = (email: string) => {
    return email.endsWith("@iaenb.com")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate admin email domain
    if (!validateAdminEmail(email)) {
      setError("Access denied. Only @iaenb.com email addresses are permitted.")
      return
    }

    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess(true)
      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      })
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Reset Email Sent</CardTitle>
          <CardDescription>Check your email for further instructions</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the
            instructions to reset your password.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Didn't receive the email?</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
              Try Different Email
            </Button>
            <Button asChild className="w-full">
              <Link href="/admin/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <KeyRound className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>Enter your admin email to receive reset instructions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Admin Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@iaenb.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">Only @iaenb.com email addresses are permitted</p>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
