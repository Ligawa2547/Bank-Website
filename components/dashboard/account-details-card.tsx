"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Shield, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import Link from "next/link"

export function AccountDetailsCard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Profile information not available</p>
        </CardContent>
      </Card>
    )
  }

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="outline">Not Submitted</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Details
        </CardTitle>
        <CardDescription>Your account information and verification status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Full Name</p>
            <p className="text-lg font-semibold">
              {profile.first_name} {profile.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Account Number</p>
            <p className="text-lg font-mono font-semibold">{profile.account_number}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Email</p>
            <p className="text-sm">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Phone</p>
            <p className="text-sm">{profile.phone_number || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Account Status</p>
            <Badge variant={profile.status === "active" ? "default" : "secondary"}>
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">KYC Status</p>
            {getKycStatusBadge(profile.kyc_status)}
          </div>
        </div>

        {profile.kyc_status !== "approved" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">Account Verification Required</p>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Complete your KYC verification to unlock all banking features and increase your transaction limits.
            </p>
            <Link href="/dashboard/kyc">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Complete Verification
              </Button>
            </Link>
          </div>
        )}

        <div className="pt-4 border-t">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="w-full bg-transparent">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
