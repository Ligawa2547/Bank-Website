"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Steps, Step } from "@/components/ui/steps"

export default function OnboardingPage() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    idType: "national_id",
    idNumber: "",
  })
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // If no user, redirect to login
  if (!user) {
    router.push("/login")
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    // Validation for each step before proceeding
    if (step === 0) {
      if (!formData.firstName || !formData.lastName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }
    } else if (step === 1) {
      if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
        toast({
          title: "Error",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        })
        return
      }
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Generate a 13-digit account number starting with IAE13728
      const accountNumberSuffix = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")
      const accountNumber = `IAE13728${accountNumberSuffix}`

      // Update the users table with additional information
      const { error: usersError } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (usersError) {
        console.error("Error updating users table:", usersError)
      }

      // Create user profile in the database
      const { error } = await supabase.from("user_profiles").insert({
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        email: user.email,
        kyc_status: "pending",
        kyc_id_type: formData.idType,
        kyc_id_number: formData.idNumber,
        account_number: accountNumber,
        balance: 0,
        email_verified: false,
        phone_verified: false,
      })

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Success",
        description: "Your profile has been created successfully!",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      title: "Personal Information",
      description: "Basic details to set up your account",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      ),
    },
    {
      title: "Contact Details",
      description: "Add your contact information",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled className="bg-gray-100" />
            <p className="text-xs text-muted-foreground">Your email is verified through the signup process.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="+1234567890"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-muted-foreground">We&apos;ll send a verification code to this number.</p>
          </div>
        </div>
      ),
    },
    {
      title: "KYC Information",
      description: "Know Your Customer information",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idType">ID Type</Label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver&apos;s License</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              name="idNumber"
              placeholder="Enter your ID number"
              value={formData.idNumber}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Upload Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">
                You&apos;ll be prompted to upload your ID and a selfie in the dashboard.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Review & Submit",
      description: "Review and complete setup",
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-[#0A5483] mb-2">Personal Information</h3>
            <p>
              <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {formData.phoneNumber}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-[#0A5483] mb-2">KYC Information</h3>
            <p>
              <span className="font-medium">ID Type:</span>{" "}
              {formData.idType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <p>
              <span className="font-medium">ID Number:</span> {formData.idNumber}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            By submitting, you confirm that all information provided is accurate and complete.
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/iae-logo.png" alt="I&E National Bank" className="h-8 w-auto" />
              <span className="text-2xl font-bold text-[#0A5483]">I&E National Bank</span>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Fill in your details to get started with I&E National Bank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Steps value={step} className="py-4">
            {steps.map((s, i) => (
              <Step key={i} title={s.title} description={s.description} />
            ))}
          </Steps>

          {steps[step].content}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button onClick={handleNext} className="bg-[#0A3D62] hover:bg-[#0F5585] text-white">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-[#0A3D62] hover:bg-[#0F5585] text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
