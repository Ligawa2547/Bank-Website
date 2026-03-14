import { createClient } from "@supabase/supabase-js"
import ProfileClient from "./profile-client"
import type { Metadata } from "next"

// Disable static prerendering; we need per-request auth
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Profile – I&E Bank",
}

export default async function ProfilePage() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching user:", error)
  }

  return <ProfileClient initialData={data} />
}
