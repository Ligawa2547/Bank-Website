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
