"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { upload } from "@vercel/blob/client"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageUpdate: (url: string) => void
  className?: string
}

export function ProfilePictureUpload({ currentImageUrl, onImageUpdate, className }: ProfilePictureUploadProps) {
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
        const { url } = await upload(`profile-pictures/${Date.now()}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload-profile-picture",
        })

        onImageUpdate(url)
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
        <AvatarImage src={preview ?? currentImageUrl ?? undefined} />
        <AvatarFallback>
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl font-semibold text-gray-600">{/* Simple user icon fallback */}👤</span>
          </div>
        </AvatarFallback>
      </Avatar>

      <input id="profilePic" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <label htmlFor="profilePic">
        <Button disabled={isPending} type="button">
          {isPending ? "Uploading..." : "Upload picture"}
        </Button>
      </label>
    </div>
  )
}
