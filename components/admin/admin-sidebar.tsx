"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Users,
  CreditCard,
  FileCheck,
  Bell,
  Settings,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const routes = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      title: "KYC Management",
      icon: FileCheck,
      href: "/admin/kyc/pending",
      active: pathname.startsWith("/admin/kyc"),
    },
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      active: pathname.startsWith("/admin/users"),
    },
    {
      title: "Transactions",
      icon: CreditCard,
      href: "/admin/transactions",
      active: pathname.startsWith("/admin/transactions"),
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/admin/notifications",
      active: pathname.startsWith("/admin/notifications"),
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/admin/reports",
      active: pathname.startsWith("/admin/reports"),
    },
    {
      title: "Legal Agreements",
      icon: FileText,
      href: "/admin/agreements",
      active: pathname.startsWith("/admin/agreements"),
    },
    {
      title: "System Settings",
      icon: Settings,
      href: "/admin/settings",
      active: pathname.startsWith("/admin/settings"),
    },
  ]

  return (
    <aside
      className={cn("bg-red-900 text-white transition-all duration-300 flex flex-col", isCollapsed ? "w-16" : "w-64")}
    >
      <div className="border-b border-red-800 p-4 flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            {logoError ? (
              <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center text-red-900 font-bold text-sm">
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
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:bg-red-800"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                route.active ? "bg-red-800 text-white" : "text-red-100 hover:bg-red-800 hover:text-white",
                isCollapsed && "justify-center",
              )}
              title={isCollapsed ? route.title : undefined}
            >
              <route.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{route.title}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-red-800 p-4">
        <div className="rounded-md bg-red-800 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-700 p-1.5 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">Admin Access</p>
                <p className="text-xs text-red-200">Restricted Area</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
