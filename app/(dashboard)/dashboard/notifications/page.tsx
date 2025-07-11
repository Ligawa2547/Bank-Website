"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Notification } from "@/types/user"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsPage() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!user || !profile?.account_number) {
      setIsLoading(false)
      return
    }

    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching notifications for account:", profile.account_number)

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("account_no", profile.account_number)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching notifications:", error)
          toast({
            title: "Error",
            description: "Failed to load notifications. Please try again.",
            variant: "destructive",
          })
          return
        }

        console.log(`Found ${data?.length || 0} notifications for account ${profile.account_number}`)
        setNotifications(data || [])
      } catch (err) {
        console.error("Unexpected error fetching notifications:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading notifications.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `account_no=eq.${profile.account_number}`,
        },
        (payload) => {
          console.log("Notification change received:", payload)

          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev])
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
  }, [user, profile, supabase, toast])

  const markAsRead = async (notificationId: string) => {
    if (updatingIds.has(notificationId)) return

    setUpdatingIds((prev) => new Set(prev).add(notificationId))

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("account_no", profile?.account_number)

      if (error) {
        console.error("Error marking notification as read:", error)
        toast({
          title: "Error",
          description: "Failed to mark notification as read.",
          variant: "destructive",
        })
        return
      }

      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
      )
    } catch (err) {
      console.error("Unexpected error marking notification as read:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read)
    if (unreadNotifications.length === 0) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("account_no", profile?.account_number)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read.",
          variant: "destructive",
        })
        return
      }

      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })))

      toast({
        title: "Success",
        description: "All notifications marked as read.",
      })
    } catch (err) {
      console.error("Unexpected error marking all notifications as read:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (updatingIds.has(notificationId)) return

    setUpdatingIds((prev) => new Set(prev).add(notificationId))

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("account_no", profile?.account_number)

      if (error) {
        console.error("Error deleting notification:", error)
        toast({
          title: "Error",
          description: "Failed to delete notification.",
          variant: "destructive",
        })
        return
      }

      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))

      toast({
        title: "Success",
        description: "Notification deleted.",
      })
    } catch (err) {
      console.error("Unexpected error deleting notification:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please log in to view your notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-gray-600">
              Account: {profile.account_number} • {unreadCount} unread notification
              {unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Your Notifications
          </CardTitle>
          <CardDescription>
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""} for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[#0A3D62]"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={updatingIds.has(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={updatingIds.has(notification.id)}
                        title="Delete notification"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <Bell className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-sm">
                You'll receive notifications here for account activities, transactions, and important updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
