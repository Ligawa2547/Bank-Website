"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, User, Settings, LogOut, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { NotificationsPopover } from "@/components/dashboard/notifications-popover"

export function DashboardHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user, profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="mr-2" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Link href="/" className="flex items-center gap-2">
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
        <span className="font-bold text-lg text-[#0A3D62] hidden md:inline-flex">I&E National Bank</span>
      </Link>

      <div className="hidden md:flex md:items-center md:gap-4 lg:gap-8">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input type="search" placeholder="Search..." className="w-full md:w-[200px] lg:w-[300px] pl-8 bg-gray-50" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Open user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A3D62] text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {profile ? `${profile.first_name} ${profile.last_name}` : user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[160px]">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
