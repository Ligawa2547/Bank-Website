import { PAYPAL_CONFIG, validatePayPalConfig } from "./config"

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalPayment {
  id: string
  intent: string
  state: string
  payer: {
    payment_method: string
  }
  transactions: Array<{
    amount: {
      total: string
      currency: string
    }
    description: string
  }>
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

let cachedToken: { token: string; expires: number } | null = null

export class PayPalClient {
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (cachedToken && Date.now() < cachedToken.expires) {
      return cachedToken.token
    }

    validatePayPalConfig()

    const auth = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")

    console.log("Requesting PayPal access token...")
    console.log("PayPal Base URL:", PAYPAL_CONFIG.BASE_URL)
    console.log("Client ID (first 10 chars):", PAYPAL_CONFIG.CLIENT_ID.substring(0, 10) + "...")

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: "grant_type=client_credentials",
      })

      console.log("PayPal token response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal token error response:", errorText)
        throw new Error(`Failed to get PayPal access token: ${errorText}`)
      }

      const data: PayPalTokenResponse = await response.json()
      console.log("PayPal token received successfully")

      // Cache the token (expires in seconds, convert to milliseconds and subtract 5 minutes for safety)
      cachedToken = {
        token: data.access_token,
        expires: Date.now() + (data.expires_in - 300) * 1000,
      }

      return data.access_token
    } catch (error) {
      console.error("Error getting PayPal access token:", error)
      throw error
    }
  }

  async createPayment(
    amount: number,
    description: string,
    paymentMethod: "paypal" | "card" = "paypal",
  ): Promise<PayPalPayment> {
    const token = await this.getAccessToken()
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/cancel`

    console.log("Creating PayPal payment:", {
      amount,
      description,
      paymentMethod,
      returnUrl,
      cancelUrl,
    })

    const paymentData = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      transactions: [
        {
          amount: {
            total: amount.toFixed(2),
            currency: "USD",
          },
          description: description,
        },
      ],
      // For card payments, set the landing page to billing
      ...(paymentMethod === "card" && {
        application_context: {
          landing_page: "billing",
          user_action: "pay_now",
          shipping_preference: "no_shipping",
        },
      }),
    }

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      console.log("PayPal create payment response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal create payment error:", errorText)
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
    const token = await this.getAccessToken()

    console.log("Executing PayPal payment:", { paymentId, payerId })

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment/${paymentId}/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          payer_id: payerId,
        }),
      })

      console.log("PayPal execute payment response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal execute payment error:", errorText)
        throw new Error(`Failed to execute PayPal payment: ${errorText}`)
      }

      const payment: PayPalPayment = await response.json()
      console.log("PayPal payment executed successfully:", payment.id)

      return payment
    } catch (error) {
      console.error("Error executing PayPal payment:", error)
      throw error
    }
  }

  async createPayout(amount: number, recipientEmail: string, description: string) {
    const token = await this.getAccessToken()

    console.log("Creating PayPal payout:", { amount, recipientEmail, description })

    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}`,
        email_subject: "You have a payout!",
        email_message: description,
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount.toFixed(2),
            currency: "USD",
          },
          receiver: recipientEmail,
          note: description,
          sender_item_id: `item_${Date.now()}`,
        },
      ],
    }

    try {
      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payoutData),
      })

      console.log("PayPal payout response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payout error:", errorText)
        throw new Error(`Failed to create PayPal payout: ${errorText}`)
      }

      const payout = await response.json()
      console.log("PayPal payout created successfully:", payout.batch_header?.payout_batch_id)

      return payout
    } catch (error) {
      console.error("Error creating PayPal payout:", error)
      throw error
    }
  }
}

export const paypalClient = new PayPalClient()
