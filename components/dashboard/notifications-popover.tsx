"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationsPopover() {
  const notifications = [
    {
      id: 1,
      title: "Payment Received",
      message: "You received $500.00 from John Doe",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: 2,
      title: "Transfer Complete",
      message: "Your transfer of $200.00 to Jane Smith was successful",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Account Alert",
      message: "Your account balance is below $100.00",
      time: "3 hours ago",
      unread: false,
    },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  notification.unread
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                    : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{notification.time}</p>
                  </div>
                  {notification.unread && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2" />}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-3 border-t">
          <Button variant="ghost" className="w-full text-sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
