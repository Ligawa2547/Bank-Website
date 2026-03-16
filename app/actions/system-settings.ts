"use server"

import { createClient } from "@supabase/supabase-js"

// Create admin client with service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function fetchSystemSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("category, settings")

    if (error) {
      console.error("Error fetching settings:", error)
      throw new Error(`Failed to fetch settings: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("System settings fetch error:", error)
    throw error
  }
}

export async function saveSystemSettings(
  category: string,
  settings: Record<string, any>,
) {
  try {
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert({
        category,
        settings,
      })

    if (error) {
      console.error("Error saving settings:", error)
      throw new Error(`Failed to save settings: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error("System settings save error:", error)
    throw error
  }
}
