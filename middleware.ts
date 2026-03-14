import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
  // Parse hostname to extract subdomain
  const isProduction = hostname.includes('bank.alghahim.co.ke')
  const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  
  let subdomain = ''
  if (isProduction) {
    const parts = hostname.split('.')
    if (parts[0] !== 'bank') {
      subdomain = parts[0]
    }
  } else if (isDevelopment) {
    // localhost:3000, localhost:3001, localhost:3002
    const port = hostname.split(':')[1]
    if (port === '3001') subdomain = 'app'
    else if (port === '3002') subdomain = 'admin'
  }

  // Clone the request URL and set the pathname based on subdomain
  const url = request.nextUrl.clone()

  // Handle redirects from main domain to subdomains
  if (!subdomain) {
    if (pathname.startsWith('/dashboard')) {
      const appUrl = isProduction
        ? `https://app.bank.alghahim.co.ke${pathname.replace('/dashboard', '')}`
        : `http://localhost:3001${pathname.replace('/dashboard', '')}`
      return NextResponse.redirect(appUrl, { status: 301 })
    }

    if (pathname.startsWith('/admin')) {
      const adminUrl = isProduction
        ? `https://admin.bank.alghahim.co.ke${pathname.replace('/admin', '')}`
        : `http://localhost:3002${pathname.replace('/admin', '')}`
      return NextResponse.redirect(adminUrl, { status: 301 })
    }
  }

  // Route handling based on subdomain
  if (subdomain === 'app') {
    // Customer app subdomain - rewrite dashboard routes
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      url.pathname = pathname === '/' ? '/dashboard' : pathname
    } else if (pathname.startsWith('/auth') || pathname === '/login' || pathname === '/signup') {
      // Allow auth routes
      url.pathname = pathname
    } else if (pathname.startsWith('/admin')) {
      // Block admin routes on customer app
      return NextResponse.redirect(
        isProduction ? 'https://admin.bank.alghahim.co.ke/' : 'http://localhost:3002/'
      )
    } else if (!pathname.startsWith('/dashboard') && pathname !== '/') {
      // Redirect other public routes back to main domain
      const mainUrl = isProduction
        ? `https://bank.alghahim.co.ke${pathname}`
        : `http://localhost:3000${pathname}`
      return NextResponse.redirect(mainUrl)
    }
  } else if (subdomain === 'admin') {
    // Admin subdomain - rewrite admin routes
    if (pathname === '/' || !pathname.startsWith('/admin')) {
      url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`
    }

    // Check auth for admin routes
    const token = request.cookies.get('auth-token')
    const userRole = request.cookies.get('user-role')?.value

    if (!token || userRole !== 'admin') {
      // Redirect non-admin users to login
      const adminLoginUrl = isProduction
        ? 'https://admin.bank.alghahim.co.ke/admin/login'
        : 'http://localhost:3002/admin/login'
      return NextResponse.redirect(adminLoginUrl)
    }
  } else {
    // Main domain - only public routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      // These should have been redirected above, but as safety net
      return NextResponse.redirect('/')
    }

    // Rewrite public routes (they don't need special handling)
    url.pathname = pathname
  }

  // Return response with rewritten pathname
  const response = NextResponse.rewrite(url)

  // Add CORS and security headers for cross-subdomain requests
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes (api routes handle their own subdomain logic)
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
