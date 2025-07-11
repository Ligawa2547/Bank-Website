"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signupStatus, setSignupStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const router = useRouter()
  const { signUp } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Add a timeout to reset loading state if it takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsLoading(false)
        setSignupStatus("error")
        setStatusMessage("Request timed out. Please try again.")

        toast({
          title: "Timeout",
          description: "Request took too long. Please try again.",
          variant: "destructive",
        })
      }, 15000) // 15 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading, toast])

  // Generate unique account number
  const generateAccountNumber = () => {
    // Generate 10-digit account number starting with 10 (bank code)
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0") // 4 random digits
    return `10${timestamp}${random}`.slice(0, 10) // Ensure exactly 10 digits
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupStatus("idle")
    setStatusMessage("")

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (!firstName || !lastName) {
      toast({
        title: "Error",
        description: "Please provide your first and last name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data, error } = await signUp(email, password)

      if (error) {
        console.error("Signup error:", error)
        setSignupStatus("error")
        setStatusMessage(error.message || "Failed to create account. Please try again.")

        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // If signup was successful, store user details in the users table
      if (data && data.user) {
        // Generate a unique account number
        const accountNumber = generateAccountNumber()

        // Insert into public.users table with all required fields
        const { error: usersError } = await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          city: city,
          country: country,
          account_no: accountNumber,
          account_balance: 0, // Initialize with zero balance
          status: "active", // Set account as active
          email_verified: false,
          phone_verified: false,
          kyc_status: "not_submitted",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (usersError) {
          console.error("Error inserting into users table:", usersError)
          setSignupStatus("error")
          setStatusMessage("Failed to create user profile. Please contact support.")

          toast({
            title: "Error",
            description: "Failed to create user profile. Please contact support.",
            variant: "destructive",
          })
          return
        }

        // Also insert into user_profiles table for compatibility (if needed)
        const { error: profilesError } = await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phone,
          city: city,
          country: country,
          account_number: accountNumber,
          balance: 0,
          email_verified: false,
          phone_verified: false,
          kyc_status: "not_submitted",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profilesError) {
          console.error("Error inserting into user_profiles table:", profilesError)
          // Don't fail the signup for this, as the main users table insert succeeded
        }

        setSignupStatus("success")
        setStatusMessage(
          `Account created successfully! Your account number is ${accountNumber}. Please check your email for confirmation link.`,
        )

        toast({
          title: "Success",
          description: `Account created! Your account number: ${accountNumber}`,
        })

        // Don't redirect immediately, let the user see the success message
        setTimeout(() => {
          router.push("/login")
        }, 7000)
      } else {
        // This case happens when Supabase returns success but no user object
        setSignupStatus("success")
        setStatusMessage("Account creation initiated. Please check your email for confirmation link.")

        toast({
          title: "Success",
          description: "Check your email for the confirmation link to complete your registration.",
        })
      }
    } catch (error: any) {
      console.error("Unexpected error during signup:", error)
      setSignupStatus("error")
      setStatusMessage(error.message || "An unexpected error occurred. Please try again.")

      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-[#0A3D62]" />
              <span className="text-2xl font-bold text-[#0A3D62]">I&E National Bank</span>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signupStatus === "success" && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {signupStatus === "error" && (
            <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading || signupStatus === "success"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading || signupStatus === "success"}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || signupStatus === "success"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading || signupStatus === "success"}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={isLoading || signupStatus === "success"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  disabled={isLoading || signupStatus === "success"}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || signupStatus === "success"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || signupStatus === "success"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || signupStatus === "success"}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0A3D62] text-white hover:bg-[#0F5585]"
              disabled={isLoading || signupStatus === "success"}
            >
              {isLoading ? "Creating account..." : signupStatus === "success" ? "Account Created" : "Create account"}
            </Button>
          </form>

          {signupStatus === "success" && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">You will be redirected to login shortly...</p>
              <Button variant="outline" onClick={() => router.push("/login")} className="mx-auto">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline text-[#0A3D62]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline text-[#0A3D62]">
              Privacy Policy
            </Link>
          </div>
          <div className="text-sm text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline text-[#0A3D62]">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
