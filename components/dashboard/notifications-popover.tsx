"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Notification } from "@/types/user"
import { formatDistanceToNow } from "date-fns"

export function NotificationsPopover() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Fetch notifications
  useEffect(() => {
    if (!user || !profile?.account_number) return

    const fetchNotifications = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("account_no", profile.account_number) // Using account_no column
        .order("created_at", { ascending: false })
        .limit(10)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      } else if (error) {
        console.error("Error fetching notifications:", error)
      }
      setIsLoading(false)
    }

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications:${profile.account_number}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `account_no=eq.${profile.account_number}`, // Using account_no column
        },
        (payload) => {
          // @ts-ignore
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10))
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, profile, supabase])

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

    if (!error) {
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => prev - 1)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

    if (unreadIds.length === 0) return

    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds)

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-[#0A3D62]" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-b p-3 ${!notification.is_read ? "bg-blue-50" : ""}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                {!notification.is_read && (
                  <div className="mt-1 flex justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-[#0A3D62]"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
