"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Notification } from "@/types/user"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function NotificationsPopover() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user || !profile?.account_number) {
      setIsLoading(false)
      return
    }

    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("account_no", profile.account_number)
          .order("created_at", { ascending: false })
          .limit(5)

        if (error) {
          console.error("Error fetching notifications:", error)
          return
        }

        setNotifications(data || [])
      } catch (err) {
        console.error("Unexpected error fetching notifications:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications_popover")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `account_no=eq.${profile.account_number}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 4)])
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((notif) => (notif.id === payload.new.id ? (payload.new as Notification) : notif)),
            )
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((notif) => notif.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("account_no", profile?.account_number)

      if (error) {
        console.error("Error marking notification as read:", error)
        return
      }

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
      )
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (!user || !profile) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Notifications</h4>
            <span className="text-sm text-gray-500">Account: {profile.account_number}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read ? "bg-gray-50 hover:bg-gray-100" : "bg-blue-50 hover:bg-blue-100"
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        {!notification.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}

          <div className="border-t pt-3">
            <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full bg-transparent" size="sm">
                View All Notifications
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
