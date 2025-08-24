import { PAYPAL_CONFIG, validatePayPalConfig } from "./config"

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalPayment {
  id: string
  state: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
  transactions: Array<{
    amount: {
      total: string
      currency: string
    }
    custom: string
  }>
}

class PayPalClient {
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor() {
    validatePayPalConfig()
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    console.log("Getting new PayPal access token...")

    const auth = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal token error response:", errorText)
        throw new Error(`Failed to get PayPal access token: ${errorText}`)
      }

      const data: PayPalTokenResponse = await response.json()

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early

      console.log("PayPal access token obtained successfully")
      return this.accessToken
    } catch (error) {
      console.error("Error getting PayPal access token:", error)
      throw error
    }
  }

  async createPayment(
    amount: number,
    userId: string,
    paymentMethod: "paypal" | "card" = "paypal",
  ): Promise<PayPalPayment> {
    const accessToken = await this.getAccessToken()

    // Use the correct domain for return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ebanking.iaenb.com"

    const paymentData = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${baseUrl}/api/paypal/success`,
        cancel_url: `${baseUrl}/api/paypal/cancel`,
      },
      transactions: [
        {
          amount: {
            total: amount.toFixed(2),
            currency: "USD",
          },
          description: `Deposit to IAE National Bank account`,
          custom: userId,
        },
      ],
      application_context: {
        brand_name: "IAE National Bank",
        landing_page: paymentMethod === "card" ? "billing" : "login",
        user_action: "pay_now",
        return_url: `${baseUrl}/api/paypal/success`,
        cancel_url: `${baseUrl}/api/paypal/cancel`,
      },
    }

    console.log("Creating PayPal payment with data:", {
      ...paymentData,
      baseUrl,
      paymentMethod,
    })

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payment creation error:", errorText)
        throw new Error(`Failed to create PayPal payment: ${errorText}`)
      }

      const payment: PayPalPayment = await response.json()
      console.log("PayPal payment created successfully:", payment.id)

      return payment
    } catch (error) {
      console.error("Error creating PayPal payment:", error)
      throw error
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<PayPalPayment> {
    const accessToken = await this.getAccessToken()

    console.log("Executing PayPal payment:", { paymentId, payerId })

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment/${paymentId}/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          payer_id: payerId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payment execution error:", errorText)
        throw new Error(`Failed to execute PayPal payment: ${errorText}`)
      }

      const executedPayment: PayPalPayment = await response.json()
      console.log("PayPal payment executed successfully:", executedPayment.id)

      return executedPayment
    } catch (error) {
      console.error("Error executing PayPal payment:", error)
      throw error
    }
  }

  async createPayout(amount: number, recipientEmail: string, userId: string): Promise<any> {
    const accessToken = await this.getAccessToken()

    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}_${userId}`,
        email_subject: "You have a payout from IAE National Bank",
        email_message: "You have received a payout from your IAE National Bank account.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount.toFixed(2),
            currency: "USD",
          },
          receiver: recipientEmail,
          note: "Withdrawal from IAE National Bank",
          sender_item_id: `item_${Date.now()}_${userId}`,
        },
      ],
    }

    console.log("Creating PayPal payout:", payoutData)

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payoutData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payout error:", errorText)
        throw new Error(`Failed to create PayPal payout: ${errorText}`)
      }

      const payout = await response.json()
      console.log("PayPal payout created successfully:", payout.batch_header.payout_batch_id)

      return payout
    } catch (error) {
      console.error("Error creating PayPal payout:", error)
      throw error
    }
  }
}

export const paypalClient = new PayPalClient()
