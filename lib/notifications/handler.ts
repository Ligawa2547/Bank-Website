// Client-side notification handler that calls API routes
export async function sendTransactionNotification(
  accountNo: string,
  transactionType: string,
  amount: number,
  status: string,
  reference: string,
  description: string,
) {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "transaction",
        accountNo,
        transactionType,
        amount,
        status,
        reference,
        description,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending transaction notification:", error)
    throw error
  }
}

export async function sendKYCNotification(accountNo: string, status: string, reason?: string) {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "kyc",
        accountNo,
        status,
        reason,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send KYC notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending KYC notification:", error)
    throw error
  }
}

export async function sendAccountStatusNotification(accountNo: string, status: string, reason?: string) {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "account_status",
        accountNo,
        status,
        reason,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send account status notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending account status notification:", error)
    throw error
  }
}

export async function sendGeneralNotification(accountNo: string, title: string, message: string) {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "general",
        accountNo,
        title,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send general notification")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending general notification:", error)
    throw error
  }
}
