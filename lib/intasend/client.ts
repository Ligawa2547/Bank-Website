const INTASEND_API_KEY = process.env.INTASEND_SECRET_KEY
const INTASEND_PUBLIC_KEY = process.env.NEXT_PUBLIC_INTASEND_PUBLIC_KEY

export const intasendClient = {
  getPublicKey: () => INTASEND_PUBLIC_KEY,

  isConfigured: () => {
    return !!(INTASEND_API_KEY && INTASEND_PUBLIC_KEY)
  },

  // Initialize payment with card details
  async initializePayment(data: {
    amount: number
    cardNumber: string
    cardHolder: string
    expiryMonth: string
    expiryYear: string
    cvv: string
    email: string
    accountNo: string
    narration: string
  }) {
    try {
      const response = await fetch("https://api.intasend.com/api/v1/payment/charge/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INTASEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: "USD",
          card_number: data.cardNumber.replace(/\s/g, ""),
          cardholder_name: data.cardHolder,
          expiry_month: data.expiryMonth,
          expiry_year: `20${data.expiryYear}`,
          cvv: data.cvv,
          email: data.email,
          description: data.narration,
          metadata: {
            account_no: data.accountNo,
          },
        }),
      })

      const result = await response.json()
      console.log("[v0] IntaSend API response:", result)
      return result
    } catch (error) {
      console.error("[v0] IntaSend initialization error:", error)
      throw error
    }
  },

  // Verify payment status
  async verifyPayment(transactionId: string) {
    try {
      const response = await fetch(`https://api.intasend.com/api/v1/payment/status/${transactionId}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${INTASEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error("[v0] IntaSend verification error:", error)
      throw error
    }
  },
}
