/**
 * Authentication Configuration for Multi-Subdomain Setup
 * Ensures authentication tokens persist across subdomains
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Create or get Supabase client with cross-subdomain cookie support
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration')
  }

  // Create client with cross-subdomain cookie configuration
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          return localStorage.getItem(key)
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          localStorage.setItem(key)
          // Also set a cookie with domain scoped to .bank.alghahim.co.ke
          setCrossDomainCookie(key, value)
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(key)
          removeCrossDomainCookie(key)
        },
      },
    },
    cookies: {
      name: 'sb',
      lifetime: 60 * 60 * 24 * 365, // 1 year
      domain: getDomain(),
      path: '/',
      sameSite: 'lax',
      secure: isProduction(),
    },
  })

  return supabaseClient
}

/**
 * Check if running in production
 */
function isProduction(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('bank.alghahim.co.ke')
  }
  return process.env.NODE_ENV === 'production'
}

/**
 * Get the appropriate domain for cookies
 */
function getDomain(): string {
  if (typeof window === 'undefined') {
    return isProduction() ? '.bank.alghahim.co.ke' : 'localhost'
  }

  const hostname = window.location.hostname
  
  if (hostname.includes('bank.alghahim.co.ke')) {
    return '.bank.alghahim.co.ke' // Include all subdomains
  }

  return 'localhost'
}

/**
 * Set a cookie that persists across all subdomains
 */
function setCrossDomainCookie(name: string, value: string, days: number = 365) {
  if (typeof window === 'undefined') return

  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  
  const domain = getDomain()
  const path = '/'
  const secure = isProduction() ? '; Secure' : ''
  const sameSite = '; SameSite=Lax'

  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=${path};domain=${domain}${secure}${sameSite}`
}

/**
 * Remove a cross-domain cookie
 */
function removeCrossDomainCookie(name: string) {
  if (typeof window === 'undefined') return

  const domain = getDomain()
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`
}

/**
 * Get all cookies from current domain (for debugging)
 */
export function getCookies(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  const cookies: Record<string, string> = {}
  document.cookie.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  return cookies
}

/**
 * Handle logout across all subdomains
 */
export async function logoutAcrossSubdomains() {
  const client = getSupabaseClient()
  await client.auth.signOut()
  
  // Clear all auth-related cookies
  const authCookies = ['sb-auth-token', 'sb-refresh-token', 'user-role', 'auth-token']
  authCookies.forEach((name) => {
    removeCrossDomainCookie(name)
  })

  // Clear localStorage
  localStorage.clear()
}

/**
 * Store user role in cookie for quick access (especially for admin checks)
 */
export function setUserRoleCookie(role: string) {
  setCrossDomainCookie('user-role', role, 365)
}

/**
 * Get user role from cookie
 */
export function getUserRoleFromCookie(): string | null {
  if (typeof window === 'undefined') return null

  const cookies = getCookies()
  return cookies['user-role'] || null
}

/**
 * Verify user is authenticated
 */
export async function verifyAuthentication(): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const { data } = await client.auth.getSession()
    return !!data.session
  } catch (error) {
    console.error('[v0] Auth verification error:', error)
    return false
  }
}

/**
 * Verify user is admin
 */
export async function verifyAdminAccess(): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const { data } = await client.auth.getSession()

    if (!data.session) {
      return false
    }

    // Check user role from database
    const { data: profile } = await client
      .from('user_profiles')
      .select('role')
      .eq('id', data.session.user.id)
      .single()

    return profile?.role === 'admin'
  } catch (error) {
    console.error('[v0] Admin verification error:', error)
    return false
  }
}
