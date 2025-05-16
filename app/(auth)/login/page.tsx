"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("password")
  const [loginStatus, setLoginStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const { signIn, signInWithMagicLink } = useAuth()
  const { toast } = useToast()
  const [retryCount, setRetryCount] = useState(0)

  // Add a timeout to reset loading state if it takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsLoading(false)
        setLoginStatus("error")
        setStatusMessage("Request timed out. Please try again.")

        toast({
          title: "Timeout",
          description: "Request took too long. Please try again.",
          variant: "destructive",
        })
      }, 30000) // 30 seconds timeout (increased from 15 seconds)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading, toast])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginStatus("idle")
    setStatusMessage("")
    setIsLoading(true)

    // Maximum number of retry attempts
    const maxRetries = 2
    setRetryCount(0)
    let success = false

    while (retryCount <= maxRetries && !success) {
      try {
        if (retryCount > 0) {
          console.log(`Retry attempt ${retryCount}...`)
        }

        const { error } = await signIn(email, password)

        if (error) {
          console.error("Login error:", error)

          // Don't retry for invalid credentials or other specific errors
          if (error.message?.includes("Invalid login credentials") || error.message?.includes("Email not confirmed")) {
            setLoginStatus("error")
            setStatusMessage(error.message || "Failed to sign in. Please check your credentials.")

            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            })
            break
          }

          // For network or timeout errors, retry
          if (retryCount < maxRetries) {
            setRetryCount(retryCount + 1)
            continue
          }

          setLoginStatus("error")
          setStatusMessage(error.message || "Failed to sign in. Please check your credentials.")

          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        success = true
        setLoginStatus("success")
        setStatusMessage("Logged in successfully! Redirecting to dashboard...")

        toast({
          title: "Success",
          description: "Logged in successfully",
        })
      } catch (error: any) {
        console.error("Unexpected error during login:", error)

        // For network or timeout errors, retry
        if (retryCount < maxRetries) {
          setRetryCount(retryCount + 1)
          continue
        }

        setLoginStatus("error")
        setStatusMessage(error.message || "An unexpected error occurred. Please try again.")

        toast({
          title: "Error",
          description: error.message || "Something went wrong",
          variant: "destructive",
        })
        break
      } finally {
        if (retryCount >= maxRetries || success) {
          setIsLoading(false)
        }
      }
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginStatus("idle")
    setStatusMessage("")
    setIsLoading(true)

    try {
      const { error } = await signInWithMagicLink(email)

      if (error) {
        console.error("Magic link error:", error)
        setLoginStatus("error")
        setStatusMessage(error.message || "Failed to send magic link. Please try again.")

        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setLoginStatus("success")
      setStatusMessage("Magic link sent! Please check your email to complete login.")

      toast({
        title: "Success",
        description: "Check your email for the magic link to log in.",
      })
    } catch (error: any) {
      console.error("Unexpected error during magic link login:", error)
      setLoginStatus("error")
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
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {loginStatus === "success" && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {loginStatus === "error" && (
            <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="password" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || loginStatus === "success"}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-[#0A3D62] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading || loginStatus === "success"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || loginStatus === "success"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0A3D62] hover:bg-[#0F5585]"
                  disabled={isLoading || loginStatus === "success"}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {retryCount > 0 ? `Retrying (${retryCount})...` : "Signing in..."}
                    </>
                  ) : loginStatus === "success" ? (
                    "Signed In"
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="magic-link">
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || loginStatus === "success"}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0A3D62] hover:bg-[#0F5585]"
                  disabled={isLoading || loginStatus === "success"}
                >
                  {isLoading ? "Sending link..." : loginStatus === "success" ? "Link Sent" : "Send magic link"}
                </Button>

                {loginStatus === "success" && activeTab === "magic-link" && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-sm text-center">
                      Please check your email inbox for the magic link to complete your login.
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline text-[#0A3D62]">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
