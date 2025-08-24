import { PAYPAL_CONFIG } from "./config"

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

interface PayPalPaymentRequest {
  intent: "sale"
  application_context?: {
    brand_name: string
    landing_page: "login" | "billing" | "no_preference"
    user_action: "continue" | "pay_now"
    return_url: string
    cancel_url: string
    shipping_preference: "no_shipping"
  }
  payer: {
    payment_method: "paypal"
  }
  transactions: Array<{
    amount: {
      total: string
      currency: "USD"
    }
    description: string
  }>
  redirect_urls: {
    return_url: string
    cancel_url: string
  }
}

interface PayPalPaymentResponse {
  id: string
  state: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

interface PayPalExecuteRequest {
  payer_id: string
}

interface PayPalPayoutRequest {
  sender_batch_header: {
    sender_batch_id: string
    email_subject: string
  }
  items: Array<{
    recipient_type: "EMAIL"
    amount: {
      value: string
      currency: "USD"
    }
    receiver: string
    note: string
    sender_item_id: string
  }>
}

class PayPalClient {
  private accessToken: string | null = null
  private tokenExpiry = 0

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Validate credentials first
    if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
      throw new Error(
        "PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.",
      )
    }

    try {
      const auth = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")

      console.log("Requesting PayPal access token...")
      console.log("PayPal Base URL:", PAYPAL_CONFIG.BASE_URL)
      console.log("Client ID (first 10 chars):", PAYPAL_CONFIG.CLIENT_ID.substring(0, 10) + "...")

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

      const responseText = await response.text()
      console.log("PayPal token response status:", response.status)
      console.log("PayPal token response:", responseText)

      if (!response.ok) {
        throw new Error(`PayPal authentication failed: ${response.status} - ${responseText}`)
      }

      const data: PayPalTokenResponse = JSON.parse(responseText)

      if (!data.access_token) {
        throw new Error("No access token received from PayPal")
      }

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early

      console.log("PayPal access token obtained successfully")
      return this.accessToken
    } catch (error: any) {
      console.error("PayPal authentication error:", error)
      throw new Error(`Failed to authenticate with PayPal: ${error.message}`)
    }
  }

  async createPayment(
    amount: number,
    description: string,
    returnUrl: string,
    cancelUrl: string,
    paymentMethod: "paypal" | "card" = "paypal",
  ): Promise<PayPalPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const paymentData: PayPalPaymentRequest = {
        intent: "sale",
        application_context: {
          brand_name: "IAE National Bank",
          landing_page: paymentMethod === "card" ? "billing" : "login",
          user_action: "pay_now",
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: "no_shipping",
        },
        payer: {
          payment_method: "paypal",
        },
        transactions: [
          {
            amount: {
              total: amount.toFixed(2),
              currency: "USD",
            },
            description,
          },
        ],
        redirect_urls: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }

      console.log("Creating PayPal payment with data:", JSON.stringify(paymentData, null, 2))

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: JSON.stringify(paymentData),
      })

      const responseText = await response.text()
      console.log("PayPal payment creation response status:", response.status)
      console.log("PayPal payment creation response:", responseText)

      if (!response.ok) {
        throw new Error(`PayPal payment creation failed: ${response.status} - ${responseText}`)
      }

      const payment: PayPalPaymentResponse = JSON.parse(responseText)
      console.log("PayPal payment created successfully:", payment.id)
      return payment
    } catch (error: any) {
      console.error("PayPal payment creation error:", error)
      throw new Error(`Failed to create PayPal payment: ${error.message}`)
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const executeData: PayPalExecuteRequest = {
        payer_id: payerId,
      }

      console.log("Executing PayPal payment:", paymentId, "with payer:", payerId)

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment/${paymentId}/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: JSON.stringify(executeData),
      })

      const responseText = await response.text()
      console.log("PayPal payment execution response status:", response.status)
      console.log("PayPal payment execution response:", responseText)

      if (!response.ok) {
        throw new Error(`PayPal payment execution failed: ${response.status} - ${responseText}`)
      }

      const result = JSON.parse(responseText)
      console.log("PayPal payment executed successfully")
      return result
    } catch (error: any) {
      console.error("PayPal payment execution error:", error)
      throw new Error(`Failed to execute PayPal payment: ${error.message}`)
    }
  }

  async createPayout(amount: number, email: string, note: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const payoutData: PayPalPayoutRequest = {
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "You have a payout from IAE National Bank!",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: "USD",
            },
            receiver: email,
            note,
            sender_item_id: itemId,
          },
        ],
      }

      console.log("Creating PayPal payout with data:", JSON.stringify(payoutData, null, 2))

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: JSON.stringify(payoutData),
      })

      const responseText = await response.text()
      console.log("PayPal payout response status:", response.status)
      console.log("PayPal payout response:", responseText)

      if (!response.ok) {
        throw new Error(`PayPal payout failed: ${response.status} - ${responseText}`)
      }

      const result = JSON.parse(responseText)
      console.log("PayPal payout created successfully")
      return result
    } catch (error: any) {
      console.error("PayPal payout error:", error)
      throw new Error(`Failed to create PayPal payout: ${error.message}`)
    }
  }

  getApprovalUrl(payment: PayPalPaymentResponse): string | null {
    const approvalLink = payment.links.find((link) => link.rel === "approval_url")
    return approvalLink ? approvalLink.href : null
  }
}

export const paypalClient = new PayPalClient()
