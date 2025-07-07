"use client"

export const dynamic = "force-dynamic"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ProfilePictureUpload } from "@/components/profile/profile-picture-upload"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

async function getProfile() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return profile
}

export default async function AccountPage() {
  const profile = await getProfile()
  const [name, setName] = useState(profile?.full_name || "")
  const [username, setUsername] = useState(profile?.username || "")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "")
      setUsername(profile.username || "")
    }
  }, [profile])

  const handleProfilePictureUpdate = () => {
    // Refresh the page to reflect the new profile picture
    window.location.reload()
  }

  async function handleSave() {
    setIsSaving(true)
    const supabase = createServerComponentClient({ cookies })

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        username: username,
      })
      .eq("id", profile?.id)

    if (error) {
      toast({
        title: "Oh no! Something went wrong.",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success!",
        description: "Your profile has been updated.",
      })
    }

    setIsSaving(false)
  }

  return (
    <div className="container max-w-3xl">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">Update your profile information here.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="picture">Profile Picture</Label>
          <ProfilePictureUpload currentImageUrl={profile?.profile_pic} onImageUpdate={handleProfilePictureUpdate} />
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
