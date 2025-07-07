import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  const userId = formData.get("userId") as string

  if (!file || !userId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  // Upload to Blob Storage
  const blob = await put(`profile-pictures/${userId}-${Date.now()}`, file, {
    access: "public",
  })

  // Update users.profile_pic
  const { error } = await supabase.from("users").update({ profile_pic: blob.url }).eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ url: blob.url })
}
