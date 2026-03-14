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
      <CardContent className="space-y-4">
        {/* Full Name */}
        <div className="flex items-center space-x-3 pb-3 border-b">
          <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium truncate">
              {profile.first_name} {profile.last_name}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center space-x-3 pb-3 border-b">
          <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Email Address</p>
            <p className="font-medium truncate">{profile.email}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3 pb-3 border-b">
          <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="font-medium">{profile.phone || "Not provided"}</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center space-x-3 pb-3 border-b">
          <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{profile.address || "Not provided"}</p>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="flex items-center space-x-3 pb-3 border-b">
          <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">
              {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "Not provided"}
            </p>
          </div>
        </div>

        {/* KYC Status */}
        <div className="flex items-center space-x-3 pt-2">
          <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">KYC Status</p>
            <div className="mt-1">{getVerificationStatus()}</div>
          </div>
        </div>

        {profile.kyc_status !== "verified" && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Complete Your Verification</p>
                <p className="text-xs text-muted-foreground">Verify your identity to unlock all features</p>
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
