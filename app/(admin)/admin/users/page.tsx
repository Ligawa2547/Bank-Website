import { sendAccountStatusNotification } from "@/lib/notifications/handler"
import { toast } from "@/components/ui/use-toast"

const handleStatusChange = async (accountNo: string, newStatus: string) => {
  try {
    setUpdatingStatus(accountNo)

    const { error } = await supabase
      .from("users")
      .update({
        account_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("account_no", accountNo)

    if (error) throw error

    // Send notification and email
    await sendAccountStatusNotification(accountNo, newStatus as "active" | "suspended" | "pending")

    toast({
      title: "Success",
      description: "User status updated successfully and notification sent",
    })

    // Refresh the users list
    fetchUsers()
  } catch (error) {
    console.error("Error updating user status:", error)
    toast({
      title: "Error",
      description: "Failed to update user status",
      variant: "destructive",
    })
  } finally {
    setUpdatingStatus(null)
  }
}

// ** rest of code here **
