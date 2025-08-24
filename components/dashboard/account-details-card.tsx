"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import Link from "next/link"

export function AccountDetailsCard() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load account details</p>
        </CardContent>
      </Card>
    )
  }

  const getVerificationStatus = () => {
    if (profile.kyc_status === "verified") {
      return <Badge className="bg-green-100 text-green-800">Verified</Badge>
    } else if (profile.kyc_status === "pending") {
      return <Badge variant="secondary">Pending Verification</Badge>
    } else {
      return <Badge variant="outline">Not Verified</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your account information and status</CardDescription>
          </div>
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-sm text-muted-foreground">Full Name</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{profile.email}</p>
                <p className="text-sm text-muted-foreground">Email Address</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{profile.phone || "Not provided"}</p>
                <p className="text-sm text-muted-foreground">Phone Number</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{profile.address || "Not provided"}</p>
                <p className="text-sm text-muted-foreground">Address</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided"}
                </p>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                {getVerificationStatus()}
                <div>
                  <p className="text-sm text-muted-foreground">KYC Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {profile.kyc_status !== "verified" && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Complete Your Verification</p>
                <p className="text-sm text-muted-foreground">Verify your identity to unlock all features</p>
              </div>
              <Link href="/dashboard/kyc">
                <Button size="sm">Complete KYC</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
