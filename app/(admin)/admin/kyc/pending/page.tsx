"use client"

import { createClientComponentClient } from "@supabase/supabase-js"
import { useState } from "react"
import { toast } from "react-toastify"
import { sendKYCStatusNotification } from "@/lib/notifications/handler"

const supabase = createClientComponentClient()

const PendingKYCPage = () => {
  const [pendingKYC, setPendingKYC] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchPendingKYC = async () => {
    const { data, error } = await supabase.from("users").select("*").eq("verification_status", "pending")

    if (error) {
      console.error("Error fetching pending KYC:", error)
      toast({
        title: "Error",
        description: "Failed to fetch pending KYC",
        variant: "destructive",
      })
    } else {
      setPendingKYC(data)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      setIsUpdating(true)

      const { error } = await supabase.from("users").update({ verification_status: "approved" }).eq("id", userId)

      if (error) throw error

      // Send notification and email
      await sendKYCStatusNotification(userId, "approved")

      toast({
        title: "Success",
        description: "KYC approved successfully",
      })

      // Refresh the data
      fetchPendingKYC()
    } catch (error) {
      console.error("Error approving KYC:", error)
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async (userId: string, reason: string) => {
    try {
      setIsUpdating(true)

      const { error } = await supabase.from("users").update({ verification_status: "rejected" }).eq("id", userId)

      if (error) throw error

      // Send notification and email
      await sendKYCStatusNotification(userId, "rejected", reason)

      toast({
        title: "Success",
        description: "KYC rejected successfully",
      })

      // Refresh the data
      fetchPendingKYC()
    } catch (error) {
      console.error("Error rejecting KYC:", error)
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div>
      <h1>Pending KYC</h1>
      <ul>
        {pendingKYC.map((user) => (
          <li key={user.id}>
            {user.name}
            <button onClick={() => handleApprove(user.id)}>Approve</button>
            <button onClick={() => handleReject(user.id, "Reason for rejection")}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PendingKYCPage
