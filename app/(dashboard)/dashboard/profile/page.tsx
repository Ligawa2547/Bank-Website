import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase" // adjust if your generated types live elsewhere
import { ProfileClient } from "./profile-client" // client-side editor UI

/* This page must run per-request so we can read auth cookies */
export const dynamic = "force-dynamic"

export default async function DashboardProfilePage() {
  // 1️⃣  Get Supabase server client (works only in a Server Component)
  const supabase = createServerComponentClient<Database>({ cookies })

  // 2️⃣  Ensure the visitor is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  // 3️⃣  Load the user’s profile row
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
  if (error || !profile) {
    // Handle missing profile gracefully
    redirect("/dashboard") // or show an error component if you prefer
  }

  // 4️⃣  Pass the data down to the client component for interactivity
  return <ProfileClient profile={profile} />
}
