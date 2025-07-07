"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Shield,
  Home,
  CreditCard,
  PiggyBank,
  Send,
  Bell,
  UserCircle,
  Settings,
  HelpCircle,
  Users,
  TrendingUp,
  X,
  FileCheck,
  Eye,
  EyeOff,
} from "lucide-react"
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
  const [showBalance, setShowBalance] = useState(true)

  const isAdmin = user?.email?.endsWith("@trustbank.com")

  const routes = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      title: "KYC Verification",
      icon: FileCheck,
      href: "/dashboard/kyc",
      active: pathname === "/dashboard/kyc",
      badge:
        profile?.kyc_status === "not_submitted" ? "Required" : profile?.kyc_status === "pending" ? "Pending" : null,
    },
    {
      title: "Transfers",
      icon: Send,
      href: "/dashboard/transfers",
      active: pathname === "/dashboard/transfers",
    },
    {
      title: "Loans",
      icon: TrendingUp,
      href: "/dashboard/loans",
      active: pathname === "/dashboard/loans",
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 transform border-r bg-white transition-transform duration-200 ease-in-out md:translate-x-0 md:relative md:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:block`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-3 sm:p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 px-1 sm:px-2">
              {logoError ? (
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-[#0A3D62] rounded-md flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  I&E
                </div>
              ) : (
                <Image
                  src="/images/iae-logo.png"
                  alt="I&E National Bank"
                  width={32}
                  height={32}
                  className="h-6 w-auto sm:h-8"
                  onError={() => setLogoError(true)}
                />
              )}
              <span className="font-bold text-sm sm:text-lg text-[#0A3D62]">I&E National Bank</span>
            </Link>
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 p-1"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {profile && (
            <div className="border-b p-3 sm:p-4">
              <div className="mb-1 text-xs sm:text-sm font-medium text-gray-600">Account</div>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate text-gray-900">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile.email || "User"}
                    </div>
                    <div className="text-xs text-gray-500 truncate font-mono">
                      {profile.account_number || "No account number"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">Available Balance</div>
                  <button
                    onClick={toggleBalanceVisibility}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500"
                    aria-label={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>

                <div className="text-lg sm:text-xl font-bold text-[#0A3D62]">
                  {showBalance ? formatCurrency(profile.balance || 0) : "••••••"}
                </div>
              </div>

              {/* Account Status Indicators */}
              <div className="mt-3 space-y-2">
                {/* Account Status */}
                {profile.status && profile.status !== "active" && (
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-orange-600" />
                      <span className="text-xs text-orange-800 capitalize">Account {profile.status}</span>
                    </div>
                  </div>
                )}

                {/* KYC Status */}
                {profile.kyc_status && profile.kyc_status !== "approved" && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-yellow-800">
                        {profile.kyc_status === "not_submitted" && "KYC Required"}
                        {profile.kyc_status === "pending" && "KYC Under Review"}
                        {profile.kyc_status === "rejected" && "KYC Rejected"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Email Verification */}
                {!profile.email_verified && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-800">Email Verification Pending</span>
                    </div>
                  </div>
                )}

                {/* Phone Verification */}
                {!profile.phone_verified && profile.phone_number && (
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-purple-600" />
                      <span className="text-xs text-purple-800">Phone Verification Pending</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <nav className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={onClose} // Close sidebar on mobile when link is clicked
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                    route.active ? "bg-[#0A3D62]/10 text-[#0A3D62]" : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <route.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">{route.title}</span>
                  {route.badge && (
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-medium",
                        route.badge === "Required" && "bg-red-100 text-red-700",
                        route.badge === "Pending" && "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {route.badge}
                    </span>
                  )}
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
                        onClick={onClose} // Close sidebar on mobile when link is clicked
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          route.active ? "bg-[#0A3D62]/10 text-[#0A3D62]" : "text-gray-600 hover:bg-gray-100",
                        )}
                      >
                        <route.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{route.title}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </nav>
          </div>

          <div className="border-t p-3 sm:p-4">
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#0A5483] p-1.5 flex-shrink-0">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#0A5483]">Support</p>
                  <p className="text-xs text-gray-600">Need help? Contact us</p>
                </div>
              </div>
              <Button
                asChild
                className="mt-2 w-full bg-[#0A5483] hover:bg-[#0F7AB3] text-white text-xs sm:text-sm"
                size="sm"
                aria-label="Contact Support"
              >
                <Link href="/dashboard/support" onClick={onClose}>
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
