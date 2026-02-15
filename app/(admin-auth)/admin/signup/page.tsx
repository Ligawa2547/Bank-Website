"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react"

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
    justification: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const validateAdminEmail = (email: string) => {
    const allowedDomains = ["@bank.aghq.co.ke", "@alghahim.co.ke", "@iaenb.com"]
    return allowedDomains.some(domain => email.endsWith(domain))
  }

  const validatePassword = (password: string) => {
    return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate admin email domain
    if (!validateAdminEmail(formData.email)) {
      setError("Access denied. Only authorized email addresses are permitted.")
      return
    }

    // Validate password strength
    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.")
      return
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    // Validate required fields
    if (!formData.fullName || !formData.department || !formData.justification) {
      setError("Please fill in all required fields.")
      return
    }

    setIsLoading(true)

    try {
      // Create the admin account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            department: formData.department,
            role: "admin",
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setError("An account with this email already exists.")
        } else {
          setError(signUpError.message)
        }
        return
      }

      // Log the admin signup request
      if (data.user) {
        const { error: logError } = await supabase.from("admin_signup_requests").insert({
          user_id: data.user.id,
          full_name: formData.fullName,
          email: formData.email,
          department: formData.department,
          justification: formData.justification,
          status: "pending",
          requested_at: new Date().toISOString(),
        })

        if (logError) {
          console.error("Error logging signup request:", logError)
        }
      }

      setSuccess(true)
      toast({
        title: "Request Submitted",
        description: "Your admin access request has been submitted for approval.",
      })
    } catch (error) {
      console.error("Signup error:", error)
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
          <CardTitle className="text-2xl font-bold text-green-600">Request Submitted</CardTitle>
          <CardDescription>Your admin access request has been submitted successfully</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your request for admin access has been submitted and is pending approval. You will receive an email
            notification once your request has been reviewed.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">What happens next:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your request will be reviewed by senior administrators</li>
              <li>• You'll receive an email with the approval decision</li>
              <li>• If approved, you can log in using your credentials</li>
            </ul>
          </div>
          <Button asChild className="w-full">
            <Link href="/admin/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <UserPlus className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Request Admin Access</CardTitle>
        <CardDescription>Submit a request for I&E National Bank admin portal access</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                name="department"
                type="text"
                placeholder="e.g., IT, Operations, Compliance"
                value={formData.department}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.name@iaenb.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-gray-500">Only @iaenb.com email addresses are permitted</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
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
            <p className="text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification for Admin Access *</Label>
            <Textarea
              id="justification"
              name="justification"
              placeholder="Please explain why you need admin access and how you plan to use it..."
              value={formData.justification}
              onChange={handleInputChange}
              required
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Provide a detailed explanation of your role and why admin access is necessary
            </p>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? "Submitting Request..." : "Submit Request"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an admin account?{" "}
            <Link href="/admin/login" className="font-medium text-red-600 hover:text-red-800 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
