import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

/**
 * Returns a typed Supabase client that can run only on the server.
 * It automatically forwards the request cookies so RLS and auth work.
 *
 * Usage:
 *   const supabase = createClient()
 */
export function createClient() {
  return createServerComponentClient<Database>({ cookies })
}
