"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Shield, Home, CreditCard, PiggyBank, Send, Bell, UserCircle, Settings, HelpCircle, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"

export function Sidebar({
  isOpen = false,
  onClose,
}: {
  isOpen?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const [logoError, setLogoError] = useState(false)

  const isAdmin = user?.email?.endsWith("@trustbank.com")

  const routes = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      title: "Transfers",
      icon: Send,
      href: "/dashboard/transfers",
      active: pathname === "/dashboard/transfers",
    },
    {
      title: "Savings",
      icon: PiggyBank,
      href: "/dashboard/savings",
      active: pathname === "/dashboard/savings",
    },
    {
      title: "Transactions",
      icon: CreditCard,
      href: "/dashboard/transactions",
      active: pathname === "/dashboard/transactions",
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      active: pathname === "/dashboard/notifications",
    },
    {
      title: "Profile",
      icon: UserCircle,
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
    {
      title: "Support",
      icon: HelpCircle,
      href: "/dashboard/support",
      active: pathname === "/dashboard/support",
    },
  ]

  const adminRoutes = isAdmin
    ? [
        {
          title: "Users",
          icon: Users,
          href: "/dashboard/admin/users",
          active: pathname.startsWith("/dashboard/admin/users"),
        },
      ]
    : []

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:block`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 px-2">
              {logoError ? (
                <div className="h-8 w-8 bg-[#0A3D62] rounded-md flex items-center justify-center text-white font-bold">
                  I&E
                </div>
              ) : (
                <Image
                  src="/images/iae-logo.png"
                  alt="I&E National Bank"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="font-bold text-lg">I&E National Bank</span>
            </Link>
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {profile && (
            <div className="border-b p-4">
              <div className="mb-1 text-sm font-medium">Account</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-xs text-gray-500">{profile.account_number}</div>
                </div>
                <div className="text-lg font-semibold text-[#0A3D62]">
                  ${typeof profile.balance === "number" ? profile.balance.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    route.active ? "bg-[#0A3D62]/10 text-[#0A3D62]" : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  {route.title}
                </Link>
              ))}

              {adminRoutes.length > 0 && (
                <>
                  <div className="my-2 border-t pt-2">
                    <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Admin</div>
                    {adminRoutes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                          route.active ? "bg-[#0A3D62]/10 text-[#0A3D62]" : "text-gray-600 hover:bg-gray-100",
                        )}
                      >
                        <route.icon className="h-4 w-4" />
                        {route.title}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#0A5483] p-1.5">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0A5483]">Support</p>
                  <p className="text-xs text-gray-600">Need help? Contact us</p>
                </div>
              </div>
              <Button
                asChild
                className="mt-2 w-full bg-[#0A5483] hover:bg-[#0F7AB3] text-white"
                size="sm"
                aria-label="Contact Support"
              >
                <Link href="/dashboard/support">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
