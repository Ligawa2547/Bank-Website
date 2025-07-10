import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileClient } from "./profile-client"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Fetch user profile data
  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (profileError) {
    console.error("Error fetching profile:", profileError)
  }

  return <ProfileClient user={user} profile={profile} />
}
