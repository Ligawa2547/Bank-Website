"use client"

import { createClientComponentClient } from "@supabase/supabase-js"
import { useState } from "react"
import { toast } from "react-toastify"
import { sendKYCStatusNotification, sendAccountStatusNotification } from "@/lib/notifications/handler"

const supabase = createClientComponentClient()

const AdminUsersPage = () => {
  const [users, setUsers] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*")
    if (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } else {
      setUsers(data)
    }
  }

  const handleVerificationStatusChange = async (userId: string, newStatus: string) => {
    try {
      setIsUpdating(true)

      const { error } = await supabase.from("users").update({ verification_status: newStatus }).eq("id", userId)

      if (error) throw error

      // Send notification and email
      await sendKYCStatusNotification(userId, newStatus)

      toast({
        title: "Success",
        description: "Verification status updated successfully",
      })

      // Refresh the data
      fetchUsers()
    } catch (error) {
      console.error("Error updating verification status:", error)
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setIsUpdating(true)

      const { error } = await supabase.from("users").update({ status: newStatus }).eq("id", userId)

      if (error) throw error

      // Send notification and email
      await sendAccountStatusNotification(userId, newStatus)

      toast({
        title: "Success",
        description: "User status updated successfully",
      })

      // Refresh the data
      fetchUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div>
      <h1>Admin Users Page</h1>
      <button onClick={fetchUsers}>Fetch Users</button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <span>{user.name}</span>
            <button onClick={() => handleVerificationStatusChange(user.id, "verified")}>Verify</button>
            <button onClick={() => handleStatusChange(user.id, "active")}>Activate</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminUsersPage
