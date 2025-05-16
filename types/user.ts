export type UserProfile = {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone_number: string
  email: string
  email_verified: boolean
  phone_verified: boolean
  city?: string
  country?: string
  kyc_status: "not_submitted" | "pending" | "approved" | "rejected"
  kyc_id_type?: string
  kyc_id_number?: string
  kyc_id_expiry?: string
  account_number: string
  balance: number
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  transaction_type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out"
  amount: number
  status: "pending" | "completed" | "failed"
  reference: string
  narration: string
  recipient_account_number?: string
  recipient_name?: string
  sender_account_number?: string
  sender_name?: string
  created_at: string
}

export type SavingsAccount = {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  is_locked: boolean
  start_date: string
  end_date?: string
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export type SupportTicket = {
  id: string
  user_id: string
  subject: string
  message: string
  status: "open" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at: string
}

export type SupportMessage = {
  id: string
  ticket_id: string
  sender_type: "user" | "support"
  message: string
  created_at: string
}

export type Referral = {
  id: string
  referrer_id: string
  referred_id: string
  status: "pending" | "completed"
  bonus_amount: number
  created_at: string
}
