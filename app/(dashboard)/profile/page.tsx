"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"
import { Camera, Save, UserIcon } from "lucide-react"

interface ProfileData {
  full_name: string
  email: string
  phone: string
  address: string
  date_of_birth: string
  bio: string
  profile_picture_url?: string
  notification_preferences: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
  }
  privacy_settings: {
    profile_visibility: "public" | "private" | "friends"
    show_email: boolean
    show_phone: boolean
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    bio: "",
    profile_picture_url: "",
    notification_preferences: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
    },
    privacy_settings: {
      profile_visibility: "private",
      show_email: false,
      show_phone: false,
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            email: user.email || "",
            phone: data.phone || "",
            address: data.address || "",
            date_of_birth: data.date_of_birth || "",
            bio: data.bio || "",
            profile_picture_url: data.profile_picture_url || "",
            notification_preferences: data.notification_preferences || {
              email_notifications: true,
              sms_notifications: false,
              push_notifications: true,
            },
            privacy_settings: data.privacy_settings || {
              profile_visibility: "private",
              show_email: false,
              show_phone: false,
            },
          })
        } else {
          // Set default values with user email
          setProfile((prev) => ({
            ...prev,
            email: user.email || "",
          }))
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!profile.full_name.trim()) {
      newErrors.full_name = "Full name is required"
    }

    if (!profile.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = "Email is invalid"
    }

    if (profile.phone && !/^\+?[\d\s-()]+$/.test(profile.phone)) {
      newErrors.phone = "Phone number is invalid"
    }

    if (profile.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        newErrors.date_of_birth = "You must be at least 18 years old"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateProfile = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      if (!user) throw new Error("No user found")

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.date_of_birth,
        bio: profile.bio,
        profile_picture_url: profile.profile_picture_url,
        notification_preferences: profile.notification_preferences,
        privacy_settings: profile.privacy_settings,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("profiles").upsert(updates)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleNotificationChange = (key: keyof ProfileData["notification_preferences"], value: boolean) => {
    setProfile((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }))
  }

  const handlePrivacyChange = (key: keyof ProfileData["privacy_settings"], value: any) => {
    setProfile((prev) => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [key]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button onClick={updateProfile} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a profile picture to personalize your account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_picture_url || "/placeholder.svg"} />
              <AvatarFallback>
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Change Picture
            </Button>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  className={errors.full_name ? "border-red-500" : ""}
                />
                {errors.full_name && <p className="text-sm text-red-500">{errors.full_name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  className={errors.date_of_birth ? "border-red-500" : ""}
                />
                {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <Switch
                id="email_notifications"
                checked={profile.notification_preferences.email_notifications}
                onCheckedChange={(checked) => handleNotificationChange("email_notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_notifications">SMS Notifications</Label>
              <Switch
                id="sms_notifications"
                checked={profile.notification_preferences.sms_notifications}
                onCheckedChange={(checked) => handleNotificationChange("sms_notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push_notifications">Push Notifications</Label>
              <Switch
                id="push_notifications"
                checked={profile.notification_preferences.push_notifications}
                onCheckedChange={(checked) => handleNotificationChange("push_notifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control who can see your information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile_visibility">Profile Visibility</Label>
              <Select
                value={profile.privacy_settings.profile_visibility}
                onValueChange={(value) => handlePrivacyChange("profile_visibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_email">Show Email Address</Label>
                <Switch
                  id="show_email"
                  checked={profile.privacy_settings.show_email}
                  onCheckedChange={(checked) => handlePrivacyChange("show_email", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show_phone">Show Phone Number</Label>
                <Switch
                  id="show_phone"
                  checked={profile.privacy_settings.show_phone}
                  onCheckedChange={(checked) => handlePrivacyChange("show_phone", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
