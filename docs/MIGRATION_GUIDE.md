# Migration Guide: Single Domain to Multi-Subdomain Architecture

This guide helps you update existing components to work with the new multi-subdomain setup.

## Quick Summary

- **Old**: All routes on single domain (`bank.alghahim.co.ke/dashboard`, `bank.alghahim.co.ke/admin`)
- **New**: Separate subdomains (`app.bank.alghahim.co.ke`, `admin.bank.alghahim.co.ke`)

## Component Updates

### 1. Navigation Links

**Before:**
```typescript
import Link from 'next/link'

export function Header() {
  return (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/admin">Admin</Link>
    </>
  )
}
```

**After:**
```typescript
import Link from 'next/link'
import { getCurrentSubdomain, getAppUrl, getAdminUrl } from '@/lib/subdomain-utils'

export function Header() {
  const subdomain = getCurrentSubdomain()
  
  return (
    <>
      {/* Internal links work fine within same subdomain */}
      <Link href="/dashboard">Dashboard</Link>
      
      {/* Cross-subdomain navigation */}
      <a href={getAppUrl('/dashboard')}>App Dashboard</a>
      <a href={getAdminUrl('/')}>Admin Panel</a>
    </>
  )
}
```

### 2. Redirect After Login

**Before:**
```typescript
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  
  const handleLogin = async () => {
    // ... login logic
    router.push('/dashboard')
  }
}
```

**After:**
```typescript
import { getAppUrl } from '@/lib/subdomain-utils'

export function LoginForm() {
  const handleLogin = async () => {
    // ... login logic
    // Redirect to app subdomain
    window.location.href = getAppUrl('/dashboard')
  }
}
```

### 3. Admin-Only Routes

**Before:**
```typescript
// In app/(admin)/layout.tsx
export default function AdminLayout() {
  // No auth check, relied on folder structure
  return <>{children}</>
}
```

**After:**
```typescript
import { verifyAdminAccess } from '@/lib/auth-config'
import { getAppUrl } from '@/lib/subdomain-utils'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await verifyAdminAccess()
  
  if (!isAdmin) {
    // Redirect to app dashboard if not admin
    redirect(getAppUrl('/dashboard'))
  }
  
  return <>{children}</>
}
```

### 4. Logout

**Before:**
```typescript
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/supabase-provider'

export function LogoutButton() {
  const router = useRouter()
  const { supabase } = useSupabase()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
}
```

**After:**
```typescript
import { logoutAcrossSubdomains, getMainUrl } from '@/lib/auth-config'

export function LogoutButton() {
  const handleLogout = async () => {
    await logoutAcrossSubdomains()
    // Redirect to main domain login
    window.location.href = getMainUrl('/login')
  }
}
```

### 5. API Routes with Auth

**Before:**
```typescript
// app/api/dashboard/stats/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  // ...
}
```

**After:**
```typescript
// app/api/dashboard/stats/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  // ...
}
```

## Configuration Updates

### Update next.config.js

Add support for multiple subdomains:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config...
  
  // Add subdomain support
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Update Supabase Provider

Ensure cookies are scoped correctly:

```typescript
// lib/auth-provider.tsx (or similar)
import { getSupabaseClient } from '@/lib/auth-config'

export function AuthProvider({ children }) {
  const supabase = getSupabaseClient()
  
  // Use supabase client from auth-config
  // It's already configured with proper cookie settings
  
  return <>{children}</>
}
```

## Testing Subdomain Navigation

### Test Helper Script

Create `lib/test-subdomains.ts`:

```typescript
export function testSubdomainNavigation() {
  if (typeof window === 'undefined') return
  
  const tests = [
    {
      name: 'Main domain navigation',
      test: () => {
        const url = getMainUrl('/features')
        console.log('Main URL:', url)
        return url.includes('bank.alghahim.co.ke')
      },
    },
    {
      name: 'App subdomain navigation',
      test: () => {
        const url = getAppUrl('/dashboard')
        console.log('App URL:', url)
        return url.includes('app.bank.alghahim.co.ke')
      },
    },
    {
      name: 'Admin subdomain navigation',
      test: () => {
        const url = getAdminUrl('/users')
        console.log('Admin URL:', url)
        return url.includes('admin.bank.alghahim.co.ke')
      },
    },
  ]
  
  tests.forEach(({ name, test }) => {
    try {
      const result = test()
      console.log(`✓ ${name}: ${result ? 'PASS' : 'FAIL'}`)
    } catch (error) {
      console.log(`✗ ${name}: ERROR -`, error)
    }
  })
}
```

Use in development:
```typescript
import { testSubdomainNavigation } from '@/lib/test-subdomains'

// Call in a useEffect or page component
useEffect(() => {
  testSubdomainNavigation()
}, [])
```

## Step-by-Step Migration

1. **Setup Infrastructure** (1-2 hours)
   - [ ] Update DNS records for subdomains
   - [ ] Update Supabase allowed redirect URLs
   - [ ] Deploy middleware.ts

2. **Update Environment** (30 mins)
   - [ ] Add environment variables to Vercel
   - [ ] Update .env.local locally

3. **Update Components** (2-3 hours)
   - [ ] Update authentication flows
   - [ ] Update navigation components
   - [ ] Update redirect logic

4. **Test & Verify** (1-2 hours)
   - [ ] Test login flow on app subdomain
   - [ ] Test admin access on admin subdomain
   - [ ] Test old route redirects

5. **Deploy** (30 mins)
   - [ ] Test in staging environment
   - [ ] Deploy to production
   - [ ] Verify all subdomains working

## Rollback Plan

If issues occur:

1. Keep old routes temporarily alongside new ones
2. Use feature flags to toggle between old and new routing
3. Monitor error rates during gradual rollout

Example feature flag:
```typescript
const USE_NEW_SUBDOMAINS = process.env.NEXT_PUBLIC_USE_SUBDOMAINS === 'true'

export function navigateToApp(path: string) {
  if (USE_NEW_SUBDOMAINS) {
    window.location.href = getAppUrl(path)
  } else {
    router.push(`/dashboard${path}`)
  }
}
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Cookies not persisting | Check domain is `.bank.alghahim.co.ke` |
| Redirect loops | Verify middleware matcher excludes API routes |
| Auth failing | Add all subdomains to Supabase URLs |
| CORS errors | Check headers configuration in middleware |
| 404 on subdomains | Verify DNS records point to same app |

## Verification Checklist

- [ ] All three subdomains resolve via DNS
- [ ] Cookies persist across subdomains
- [ ] User can login on app subdomain
- [ ] Admin users can access admin subdomain
- [ ] Non-admin users redirected from admin
- [ ] Old routes (/dashboard, /admin) redirect properly
- [ ] Analytics tracks each subdomain separately
- [ ] Environment variables set in production
- [ ] Supabase auth URLs updated
- [ ] SSL certificates valid for all subdomains

## Next Steps

1. Follow the setup guide in `SUBDOMAIN_SETUP.md`
2. Update your DNS records
3. Deploy the middleware
4. Test locally with port-based development
5. Deploy to production
6. Monitor for issues during rollout
