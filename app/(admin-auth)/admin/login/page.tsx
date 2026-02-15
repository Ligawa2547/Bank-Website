"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const validateAdminEmail = (email: string) => {
    const allowedDomains = ["@bank.aghq.co.ke", "@alghahim.co.ke", "@iaenb.com"]
    return allowedDomains.some(domain => email.endsWith(domain))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate admin email domain
    if (!validateAdminEmail(email)) {
      setError("Access denied. Only authorized email addresses are permitted for admin access.")
      return
    }

    setIsLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user) {
        // Double-check the email domain after successful authentication
        if (!validateAdminEmail(data.user.email || "")) {
          await supabase.auth.signOut()
          setError("Access denied. Admin access is restricted to authorized email addresses.")
          return
        }

        toast({
          title: "Login Successful",
          description: "Welcome to the AV Bank Admin Portal.",
        })

        // Redirect to admin dashboard
        router.push("/admin")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        <CardDescription>Sign in to access the AV Bank admin portal</CardDescription>
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
              placeholder="admin@bank.aghq.co.ke"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">Enter your authorized admin email</p>
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
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center">
            <Link href="/admin/forgot-password" className="text-sm text-red-600 hover:text-red-800 transition-colors">
              Forgot your password?
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need admin access?{" "}
              <Link href="/admin/signup" className="font-medium text-red-600 hover:text-red-800 transition-colors">
                Request Access
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Regular customer?</p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/login">Customer Login</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
