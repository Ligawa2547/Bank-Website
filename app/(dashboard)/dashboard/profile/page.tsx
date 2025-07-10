import { createClient } from "@supabase/supabase-js"
import ProfileClient from "./profile-client"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

// Disable static prerendering; we need per-request auth
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Profile – I&E Bank",
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

export default async function ProfilePage() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase.from("users").select("name,email,phone,profile_pic").eq("id", user.id).single()

  if (error) throw error

  return <ProfileClient initialData={data} />
}
