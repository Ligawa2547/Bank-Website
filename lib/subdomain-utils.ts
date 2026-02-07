/**
 * Subdomain Utilities for Multi-tenant Application
 * Handles URL generation, redirects, and authentication across subdomains
 */

const isProduction = typeof window !== 'undefined' 
  ? window.location.hostname.includes('bank.alghahim.co.ke')
  : process.env.NODE_ENV === 'production'

export const SUBDOMAINS = {
  MAIN: 'bank.alghahim.co.ke',
  APP: 'app.bank.alghahim.co.ke',
  ADMIN: 'admin.bank.alghahim.co.ke',
}

export const PORTS = {
  MAIN: 3000,
  APP: 3001,
  ADMIN: 3002,
}

/**
 * Get the current subdomain
 */
export function getCurrentSubdomain(): 'main' | 'app' | 'admin' | null {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  
  if (!hostname.includes('alghahim')) return null
  if (hostname.includes('app.')) return 'app'
  if (hostname.includes('admin.')) return 'admin'
  
  return 'main'
}

/**
 * Get URL for a subdomain
 */
export function getSubdomainUrl(subdomain: 'main' | 'app' | 'admin', path: string = '/'): string {
  let baseUrl: string

  if (isProduction) {
    const bases = {
      main: `https://${SUBDOMAINS.MAIN}`,
      app: `https://${SUBDOMAINS.APP}`,
      admin: `https://${SUBDOMAINS.ADMIN}`,
    }
    baseUrl = bases[subdomain]
  } else {
    const ports = {
      main: PORTS.MAIN,
      app: PORTS.APP,
      admin: PORTS.ADMIN,
    }
    baseUrl = `http://localhost:${ports[subdomain]}`
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Get app URL (customer dashboard)
 */
export function getAppUrl(path: string = '/'): string {
  return getSubdomainUrl('app', path)
}

/**
 * Get admin URL
 */
export function getAdminUrl(path: string = '/'): string {
  return getSubdomainUrl('admin', path)
}

/**
 * Get main domain URL
 */
export function getMainUrl(path: string = '/'): string {
  return getSubdomainUrl('main', path)
}

/**
 * Redirect to a subdomain
 */
export function redirectToSubdomain(subdomain: 'main' | 'app' | 'admin', path: string = '/') {
  if (typeof window === 'undefined') return

  const url = getSubdomainUrl(subdomain, path)
  window.location.href = url
}

/**
 * Check if current user is admin
 */
export function isAdminUser(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const userRole = localStorage.getItem('user-role')
    return userRole === 'admin'
  } catch {
    return false
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const token = localStorage.getItem('auth-token')
    return !!token
  } catch {
    return false
  }
}

/**
 * Configure Supabase cookies for cross-subdomain support
 * Call this during Supabase client initialization
 */
export function getSupabaseCookieConfig() {
  return {
    // Scoped to .bank.alghahim.co.ke so all subdomains can access
    domain: isProduction ? '.bank.alghahim.co.ke' : 'localhost',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const,
  }
}

/**
 * Helper to create Supabase client with proper cookie config
 * Use this in providers
 */
export function createSupabaseClientConfig() {
  return {
    cookieOptions: getSupabaseCookieConfig(),
    cookieName: 'sb-auth-token',
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce' as const,
    },
  }
}
