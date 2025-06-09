import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/types/user"

export const metadata: Metadata = {
  title: "Notifications | IAE Banking",
  description: "View and manage your account notifications",
}

async function getNotifications(userId: string, accountNo: string) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch notifications using account_no for better security and accuracy
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("account_no", accountNo)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return data as Notification[]
}

async function getUserProfile(userId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.from("users").select("account_no").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

export default async function NotificationsPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return notFound()
  }

  // Get user's account number first
  const userProfile = await getUserProfile(session.user.id)

  if (!userProfile?.account_no) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Unable to load notifications. Please complete your profile setup.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const notifications = await getNotifications(session.user.id, userProfile.account_no)

  // Group notifications by read status
  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  // Mark all as read function
  async function markAllAsRead() {
    "use server"
    const supabase = createServerComponentClient({ cookies })
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("account_no", userProfile.account_no)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Account: {userProfile.account_no}</p>
        </div>
        <form action={markAllAsRead}>
          <Button variant="outline" type="submit" disabled={unreadNotifications.length === 0}>
            Mark all as read
          </Button>
        </form>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread{" "}
            {unreadNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">You don't have any notifications yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Notifications for account {userProfile.account_no} will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">You don't have any unread notifications.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  New notifications for account {userProfile.account_no} will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {unreadNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationCard({ notification }: { notification: Notification }) {
  const formattedDate = format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")

  return (
    <Card className={notification.is_read ? "bg-white" : "bg-blue-50 border-blue-200"}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{notification.title}</CardTitle>
          <div className="flex items-center gap-2">
            {notification.account_no && (
              <Badge variant="outline" className="text-xs">
                {notification.account_no}
              </Badge>
            )}
            {!notification.is_read && <Badge variant="secondary">New</Badge>}
          </div>
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{notification.message}</p>
      </CardContent>
    </Card>
  )
}
