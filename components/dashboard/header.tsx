"use client"

import { Menu, Search, User, LogOut, Settings, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/providers/session-provider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { NotificationsPopover } from "./notifications-popover"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function Header() {
  const { session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const userEmail = session?.user?.email || ""
  const userName = session?.user?.user_metadata?.full_name || userEmail.split("@")[0]
  const userInitials = userName
    .split(" ")
    .map((name: string) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 md:px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Toggle menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search bar */}
      <div className="flex flex-1 items-center justify-center px-4 md:justify-start">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search transactions, accounts..."
            className="pl-10 pr-4 w-full bg-gray-50 border-gray-200 focus:bg-white dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Notifications */}
        <NotificationsPopover />

        {/* Quick actions */}
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/transfers")}
            className="text-sm font-medium"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Transfer
          </Button>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.user_metadata?.avatar_url || "/placeholder.svg"} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                </div>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isLoading}
              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Signing out..." : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Export as default as well for compatibility
export default Header
