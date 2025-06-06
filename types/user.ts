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
  user_id?: string
  account_no?: string
  transaction_type: "deposit" | "withdrawal" | "transfer_in" | "transfer_out" | "loan_disbursement" | "loan_repayment"
  amount: number
  status: "pending" | "completed" | "failed"
  reference: string
  narration: string
  recipient_account_number?: string
  recipient_name?: string
  sender_account_number?: string
  sender_name?: string
  created_at: string
  updated_at?: string
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

export type LoanType = {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  interest_rate: number
  term_months: number
  requirements: string[]
  is_active: boolean
}

export type LoanApplication = {
  id: string
  user_id: string
  loan_type_id: string
  requested_amount: number
  approved_amount?: number
  status: "pending" | "approved" | "rejected" | "disbursed" | "completed"
  purpose: string
  employment_status: string
  monthly_income: number
  existing_loans: boolean
  credit_score?: number
  application_date: string
  approval_date?: string
  disbursement_date?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
  loan_types?: {
    name: string
    interest_rate: number
    term_months: number
  }
}

export type LoanRepayment = {
  id: string
  loan_application_id: string
  amount: number
  due_date: string
  paid_date?: string
  status: "pending" | "paid" | "overdue"
  penalty_amount?: number
  created_at: string
}

export type LoanEligibility = {
  eligible: boolean
  max_amount: number
  reasons: string[]
  credit_score_required?: number
  income_requirement?: number
}
