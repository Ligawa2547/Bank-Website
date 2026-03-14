# Multi-Subdomain Architecture Implementation Guide

## Overview
This document outlines the implementation of a multi-subdomain architecture for Alghahim Virtual Bank with three separate subdomains:
- **bank.alghahim.co.ke** - Public marketing pages
- **app.bank.alghahim.co.ke** - Customer authenticated dashboard
- **admin.bank.alghahim.co.ke** - Admin panel (admin only)

## Architecture Components

### 1. Middleware (`middleware.ts`)
Handles hostname-based routing and redirects:
- Extracts subdomain from hostname
- Redirects old routes (`/dashboard`, `/admin`) to new subdomains
- Enforces authentication on admin subdomain
- Rewrites routes based on subdomain context

**How it works:**
- Subdomain detection: Parses hostname to identify `app`, `admin`, or main domain
- Route rewriting: Maps routes based on subdomain without changing visible URL
- Auth enforcement: Validates admin role before allowing admin subdomain access
- Graceful fallbacks: Redirects users to appropriate subdomain if they access wrong routes

### 2. Subdomain Utilities (`lib/subdomain-utils.ts`)
Client-side utilities for managing cross-subdomain navigation:
- `getCurrentSubdomain()` - Returns current subdomain
- `getSubdomainUrl()` - Generates URLs for any subdomain
- `getAppUrl()` - Navigate to customer app
- `getAdminUrl()` - Navigate to admin panel
- `getMainUrl()` - Navigate to main site
- `redirectToSubdomain()` - Perform cross-subdomain redirects
- Cookie configuration helpers for Supabase

### 3. Auth Configuration (`lib/auth-config.ts`)
Handles authentication across subdomains:
- Supabase client with cookie scoping to `.bank.alghahim.co.ke`
- Cross-subdomain cookie management
- Role-based access control
- Admin verification utilities
- Logout across all subdomains

## Environment Variables

Set these in your `.env.local` or Vercel dashboard:

```bash
# Multi-subdomain URLs
BASE_URL=https://bank.alghahim.co.ke
NEXT_PUBLIC_APP_URL=https://app.bank.alghahim.co.ke
NEXT_PUBLIC_ADMIN_URL=https://admin.bank.alghahim.co.ke
NEXT_PUBLIC_BASE_URL=https://bank.alghahim.co.ke

# Development (for local testing with different ports)
NEXT_PUBLIC_DEV_APP_URL=http://localhost:3001
NEXT_PUBLIC_DEV_ADMIN_URL=http://localhost:3002
NEXT_PUBLIC_DEV_BASE_URL=http://localhost:3000
```

## Implementation Steps

### Step 1: DNS/Subdomain Setup
Configure your DNS records:
```
bank.alghahim.co.ke          A  -> Your IP / CNAME -> vercel.com
app.bank.alghahim.co.ke      CNAME -> your-project.vercel.app
admin.bank.alghahim.co.ke    CNAME -> your-project.vercel.app
*.bank.alghahim.co.ke        CNAME -> your-project.vercel.app (wildcard)
```

### Step 2: Update next.config.js
Ensure your Next.js config supports the hostname-based routing:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable hostname-based routing
  experimental: {
    isrMemoryCacheSize: 100 * 1024 * 1024, // 100 MB
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.alghahim.co.ke',
      },
    ],
  },
}

module.exports = nextConfig
```

### Step 3: Update Supabase Auth Settings
In your Supabase project settings:
1. Go to Authentication → URLs
2. Add all three URLs:
   - `https://bank.alghahim.co.ke`
   - `https://app.bank.alghahim.co.ke`
   - `https://admin.bank.alghahim.co.ke`
3. Set redirect URLs for login callbacks to all three domains

### Step 4: Update Application Code
Use the subdomain utilities in your components:

```typescript
import { getAppUrl, getAdminUrl, getCurrentSubdomain } from '@/lib/subdomain-utils'
import { getSupabaseClient, verifyAdminAccess } from '@/lib/auth-config'

// Navigate to app
export function LoginButton() {
  const handleLogin = () => {
    // After login, redirect to app
    window.location.href = getAppUrl('/dashboard')
  }
  
  return <button onClick={handleLogin}>Login</button>
}

// Protect admin routes
export async function AdminLayout() {
  const isAdmin = await verifyAdminAccess()
  
  if (!isAdmin) {
    redirect(getAppUrl('/dashboard'))
  }
  
  return <AdminPanel />
}
```

### Step 5: Local Development

Run three development servers on different ports:

```bash
# Terminal 1 - Main domain (port 3000)
npm run dev

# Terminal 2 - App subdomain (port 3001)
PORT=3001 npm run dev

# Terminal 3 - Admin subdomain (port 3002)
PORT=3002 npm run dev
```

Access locally via:
- Main: `http://localhost:3000`
- App: `http://localhost:3001`
- Admin: `http://localhost:3002`

## File Structure

After implementation, your file structure will remain mostly the same:
```
app/
├── (auth)/                 # Auth routes (login, signup, reset password)
├── (dashboard)/            # Customer dashboard routes
│   └── dashboard/
│       ├── page.tsx
│       ├── profile/
│       ├── transactions/
│       └── transfers/
├── (admin)/               # Admin routes
│   └── admin/
│       ├── page.tsx
│       ├── users/
│       ├── transactions/
│       └── settings/
├── layout.tsx             # Root layout
└── page.tsx               # Main marketing page
```

The middleware handles the mapping:
- `bank.alghahim.co.ke/` → Shows `app/page.tsx` (marketing)
- `app.bank.alghahim.co.ke/` → Shows `app/(dashboard)/layout.tsx`
- `admin.bank.alghahim.co.ke/` → Shows `app/(admin)/layout.tsx`

## Authentication Flow

1. User visits `bank.alghahim.co.ke`
2. User clicks "Login" → Redirects to `app.bank.alghahim.co.ke/login`
3. User authenticates via Supabase
4. Auth tokens stored in cookies scoped to `.bank.alghahim.co.ke`
5. All subdomains can access the same cookies
6. Admin users can access `admin.bank.alghahim.co.ke`
7. Non-admin users redirected to `app.bank.alghahim.co.ke` if they try admin

## Cookie Configuration

Cookies are configured with:
- **Domain**: `.bank.alghahim.co.ke` (includes all subdomains)
- **Path**: `/`
- **Secure**: Yes (HTTPS only in production)
- **SameSite**: Lax (allows cross-site cookie send)
- **MaxAge**: 1 year (365 days)

This ensures authentication persists across all subdomains automatically.

## Redirects

Old routes are automatically redirected:
- `/dashboard/*` → `https://app.bank.alghahim.co.ke/*`
- `/admin/*` → `https://admin.bank.alghahim.co.ke/*`

These are 301 permanent redirects for proper SEO.

## Deployment to Vercel

1. Create a new Vercel project (or use existing)
2. Configure environment variables in Vercel project settings
3. Add all three subdomains to your domain settings:
   - `bank.alghahim.co.ke`
   - `app.bank.alghahim.co.ke`
   - `admin.bank.alghahim.co.ke`
4. Deploy your application

Vercel will automatically serve all subdomains from the same deployment.

## Security Considerations

1. **HTTPS Required**: All subdomains must use HTTPS in production
2. **Role-Based Access**: Admin subdomain enforces admin role via middleware and RLS
3. **CORS Headers**: Set appropriately for cross-subdomain requests
4. **Cookie Scope**: Scoped to parent domain but path-specific
5. **Environment Secrets**: Keep all API keys and secrets in Vercel/environment only

## Testing

### Test Subdomain Routing
```bash
# Test main domain only shows public pages
curl -H "Host: localhost:3000" http://localhost:3000/dashboard
# Should redirect to localhost:3001

# Test app subdomain shows dashboard
curl -H "Host: localhost:3001" http://localhost:3001/
# Should show dashboard

# Test admin without auth
curl -H "Host: localhost:3002" http://localhost:3002/admin
# Should redirect to login
```

### Test Authentication Persistence
1. Login on `app.bank.alghahim.co.ke`
2. Navigate to `admin.bank.alghahim.co.ke`
3. Should remain logged in if user is admin

## Troubleshooting

### Issue: Cookies not persisting across subdomains
**Solution**: Ensure cookie domain is set to `.bank.alghahim.co.ke` (with leading dot)

### Issue: Admin page not loading for admin users
**Solution**: Check user role in database, verify RLS policies allow access

### Issue: Redirects not working locally
**Solution**: Use port-based routing for development (3000, 3001, 3002)

### Issue: Authentication failing on new subdomain
**Solution**: Add all subdomains to Supabase allowed redirect URLs

## Support
For issues or questions about this architecture, refer to:
- Middleware documentation: See `middleware.ts` comments
- Supabase hostname-based routing: https://supabase.com/docs
- Next.js middleware: https://nextjs.org/docs/advanced-features/middleware
