import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to get account number
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("account_number, first_name, last_name")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Parse query parameters
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const format = searchParams.get("format") || "json" // json, csv, pdf
    const transactionType = searchParams.get("type") || "all"

    // Build query
    let query = supabase
      .from("transactions")
      .select("*")
      .or(
        `sender_account_number.eq.${profile.account_number},recipient_account_number.eq.${profile.account_number},account_no.eq.${profile.account_number}`,
      )
      .order("created_at", { ascending: false })

    // Apply date filters
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Apply transaction type filter
    if (transactionType !== "all") {
      query = query.eq("transaction_type", transactionType)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Process transactions to show correct perspective
    const processedTransactions =
      transactions?.map((transaction) => {
        const processed = { ...transaction }

        // Determine transaction type from user's perspective
        if (transaction.sender_account_number === profile.account_number) {
          processed.transaction_type = "transfer_out"
          processed.amount_display = `-${transaction.amount}`
        } else if (transaction.recipient_account_number === profile.account_number) {
          processed.transaction_type = "transfer_in"
          processed.amount_display = `+${transaction.amount}`
        } else if (transaction.transaction_type === "deposit" || transaction.transaction_type === "loan_disbursement") {
          processed.amount_display = `+${transaction.amount}`
        } else {
          processed.amount_display = `-${transaction.amount}`
        }

        return processed
      }) || []

    // Calculate summary
    const summary = {
      totalTransactions: processedTransactions.length,
      totalIncoming: processedTransactions
        .filter(
          (t) =>
            t.transaction_type === "deposit" ||
            t.transaction_type === "transfer_in" ||
            t.transaction_type === "loan_disbursement",
        )
        .reduce((sum, t) => sum + t.amount, 0),
      totalOutgoing: processedTransactions
        .filter(
          (t) =>
            t.transaction_type === "withdrawal" ||
            t.transaction_type === "transfer_out" ||
            t.transaction_type === "loan_repayment",
        )
        .reduce((sum, t) => sum + t.amount, 0),
      dateRange: {
        start:
          startDate ||
          (processedTransactions.length > 0
            ? processedTransactions[processedTransactions.length - 1].created_at
            : null),
        end: endDate || (processedTransactions.length > 0 ? processedTransactions[0].created_at : null),
      },
    }

    // Return different formats
    if (format === "csv") {
      const csvContent = generateCSV(processedTransactions, profile, summary)
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="statement_${profile.account_number}_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    if (format === "pdf") {
      // For PDF, we'll return the data and let the frontend handle PDF generation
      // or implement server-side PDF generation here
      return NextResponse.json({
        transactions: processedTransactions,
        summary,
        profile,
        format: "pdf",
      })
    }

    // Default JSON response
    return NextResponse.json({
      transactions: processedTransactions,
      summary,
      profile,
    })
  } catch (error) {
    console.error("Error generating statement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCSV(transactions: any[], profile: any, summary: any): string {
  const headers = ["Date", "Time", "Type", "Description", "Reference", "Amount", "Status", "Balance Impact"]

  let csvContent = headers.join(",") + "\n"

  // Add summary information
  csvContent += `\n"Account Statement for ${profile.first_name} ${profile.last_name}"\n`
  csvContent += `"Account Number: ${profile.account_number}"\n`
  csvContent += `"Statement Period: ${summary.dateRange.start ? new Date(summary.dateRange.start).toLocaleDateString() : "N/A"} to ${summary.dateRange.end ? new Date(summary.dateRange.end).toLocaleDateString() : "N/A"}"\n`
  csvContent += `"Total Transactions: ${summary.totalTransactions}"\n`
  csvContent += `"Total Money In: $${summary.totalIncoming.toFixed(2)}"\n`
  csvContent += `"Total Money Out: $${summary.totalOutgoing.toFixed(2)}"\n`
  csvContent += `"Net Amount: $${(summary.totalIncoming - summary.totalOutgoing).toFixed(2)}"\n\n`

  // Add transaction data
  transactions.forEach((transaction) => {
    const date = new Date(transaction.created_at)
    const dateStr = date.toLocaleDateString()
    const timeStr = date.toLocaleTimeString()

    const type = getTransactionTypeLabel(transaction.transaction_type)
    const description = getTransactionDescription(transaction, profile.account_number)
    const status = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
    const amount = `$${transaction.amount.toFixed(2)}`
    const balanceImpact = transaction.amount_display

    const row = [
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${type}"`,
      `"${description.replace(/"/g, '""')}"`,
      `"${transaction.reference}"`,
      `"${amount}"`,
      `"${status}"`,
      `"${balanceImpact}"`,
    ]

    csvContent += row.join(",") + "\n"
  })

  return csvContent
}

function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case "deposit":
      return "Deposit"
    case "withdrawal":
      return "Withdrawal"
    case "transfer_in":
      return "Money Received"
    case "transfer_out":
      return "Money Sent"
    case "loan_disbursement":
      return "Loan Disbursement"
    case "loan_repayment":
      return "Loan Payment"
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
  }
}

function getTransactionDescription(transaction: any, userAccountNumber: string): string {
  if (transaction.transaction_type === "deposit") {
    return transaction.narration || "Account deposit"
  } else if (transaction.transaction_type === "withdrawal") {
    return transaction.narration || "Account withdrawal"
  } else if (transaction.transaction_type === "transfer_in") {
    const senderName = transaction.sender_name || "Unknown sender"
    return `From ${senderName}`
  } else if (transaction.transaction_type === "transfer_out") {
    const recipientName = transaction.recipient_name || "Unknown recipient"
    return `To ${recipientName}`
  } else if (transaction.transaction_type === "loan_disbursement") {
    return transaction.narration || "Loan disbursement"
  } else if (transaction.transaction_type === "loan_repayment") {
    return transaction.narration || "Loan repayment"
  }
  return transaction.narration || "Transaction"
}
