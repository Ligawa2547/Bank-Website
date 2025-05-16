"use client"

import { useEffect } from "react"

import { useState } from "react"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
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
  const [loginStatus, setLoginStatus] = useState<"idle" | "success" | "error" | "retrying">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [logoError, setLogoError] = useState(false)
  const router = useRouter()
  const { signIn, signInWithMagicLink } = useAuth()
  const { toast } = useToast()

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
      }, 45000) // 45 seconds timeout (increased from 30 seconds)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading, toast])

  // Check network connectivity
  const checkConnectivity = async () => {
    try {
      // First check navigator.onLine
      if (!navigator.onLine) {
        return false
      }

      // Then try to fetch a small endpoint to confirm actual connectivity
      const response = await fetch("/api/health-check", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })
      return response.ok
    } catch (error) {
      console.error("Connectivity check failed:", error)
      return false
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginStatus("idle")
    setStatusMessage("")

    // Check if we're offline
    const isConnected = await checkConnectivity()
    if (!isConnected) {
      setLoginStatus("error")
      setStatusMessage("You appear to be offline. Please check your internet connection and try again.")
      toast({
        title: "Network Error",
        description: "You appear to be offline. Please check your internet connection.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const currentRetry = retryCount

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error("Login error:", error)

        // Check if it's a network error
        if (
          error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("timeout")
        ) {
          // Network error - we can retry
          if (currentRetry < 3) {
            // Implement exponential backoff
            const backoffTime = Math.pow(2, currentRetry) * 1000 // 1s, 2s, 4s, 8s
            setLoginStatus("retrying")
            setStatusMessage(`Network issue detected. Retrying in ${backoffTime / 1000} seconds...`)

            await new Promise((resolve) => setTimeout(resolve, backoffTime))

            setRetryCount(currentRetry + 1)
            // Try again
            handlePasswordLogin(e)
            return
          } else {
            setLoginStatus("error")
            setStatusMessage("Network connection issue. Please check your internet and try again later.")
          }
        } else {
          // Auth error - no retry
          setLoginStatus("error")
          setStatusMessage(error.message)
        }

        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setLoginStatus("success")
        setStatusMessage("Login successful! Redirecting...")

        toast({
          title: "Success",
          description: "You have successfully logged in.",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Unexpected error during login:", error)
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

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginStatus("idle")
    setStatusMessage("")
    setIsLoading(true)

    // Maximum number of retry attempts
    const maxRetries = 2
    let currentRetry = 0

    while (currentRetry <= maxRetries) {
      try {
        if (currentRetry > 0) {
          console.log(`Magic link retry attempt ${currentRetry}...`)
          // Add exponential backoff delay between retries
          const backoffDelay = Math.min(1000 * Math.pow(2, currentRetry - 1), 4000)
          await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        }

        const { error } = await signInWithMagicLink(email)

        if (error) {
          console.error("Magic link error:", error)

          // For network errors, retry
          if (
            error.message?.includes("Failed to fetch") ||
            error.message?.includes("NetworkError") ||
            error.message?.includes("network")
          ) {
            if (currentRetry < maxRetries) {
              currentRetry++
              continue
            }
          }

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
        break
      } catch (error: any) {
        console.error("Unexpected error during magic link login:", error)

        // For network errors, retry
        if ((error.message?.includes("fetch") || error.message?.includes("network")) && currentRetry < maxRetries) {
          currentRetry++
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
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              {logoError ? (
                <div className="h-8 w-8 bg-[#0A3D62] rounded-md flex items-center justify-center text-white font-bold">
                  I&E
                </div>
              ) : (
                <Image
                  src="/images/iae-logo.png"
                  alt="I&E National Bank"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="text-2xl font-bold text-[#0A3D62]">I&E National Bank</span>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">Enter your email and password to sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {loginStatus === "retrying" && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <AlertTitle>Retrying Connection</AlertTitle>
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
                      {retryCount > 0 ? `Retrying (${retryCount}/3)...` : "Signing in..."}
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
