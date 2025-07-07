"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { upload } from "@vercel/blob/client"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Props {
  currentUrl: string | null
  userId: string
  onUploaded: (url: string) => void
  className?: string
}

export default function ProfilePictureUpload({ currentUrl, userId, onUploaded, className }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Unsupported file type", variant: "destructive" })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large (max 5 MB)", variant: "destructive" })
      return
    }

    // Preview
    setPreview(URL.createObjectURL(file))

    startTransition(async () => {
      try {
        const {
          url,
        }: {
          url: string
        } = await upload(`profile-pictures/${userId}-${Date.now()}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload-profile-picture",
        })

        onUploaded(url)
        toast({ title: "Profile picture updated!" })
      } catch (err) {
        toast({
          title: "Upload failed",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Avatar className="h-32 w-32">
        <AvatarImage src={preview ?? currentUrl ?? undefined} />
        <AvatarFallback>
          <i data-lucide="user" className="h-12 w-12 stroke-[1.5]" />
        </AvatarFallback>
      </Avatar>

      <input id="profilePic" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <label htmlFor="profilePic">
        <Button disabled={isPending}>Upload picture</Button>
      </label>
    </div>
  )
}
