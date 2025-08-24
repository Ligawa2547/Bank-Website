import { paypalConfig } from "./config"

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
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

interface PayPalPayoutResponse {
  batch_header: {
    payout_batch_id: string
    batch_status: string
  }
}

class PayPalClient {
  private accessToken: string | null = null
  private tokenExpiry = 0

  async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken
      }

      console.log("Getting new PayPal access token...")

      const auth = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString("base64")

      const response = await fetch(`${paypalConfig.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal token error response:", errorText)
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
      }

      const data: PayPalTokenResponse = await response.json()

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early

      console.log("PayPal access token obtained successfully")
      return this.accessToken
    } catch (error: any) {
      console.error("Error getting PayPal access token:", error)
      throw new Error(`Failed to get access token: ${error.message}`)
    }
  }

  async createPayment(amount: number, currency: string, description: string): Promise<PayPalPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const paymentData = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        transactions: [
          {
            amount: {
              total: amount.toFixed(2),
              currency: currency,
            },
            description: description,
            item_list: {
              items: [
                {
                  name: description,
                  quantity: "1",
                  price: amount.toFixed(2),
                  currency: currency,
                },
              ],
            },
          },
        ],
        redirect_urls: {
          return_url: paypalConfig.returnUrl,
          cancel_url: paypalConfig.cancelUrl,
        },
      }

      console.log("Creating PayPal payment:", paymentData)

      const response = await fetch(`${paypalConfig.baseUrl}/v1/payments/payment`, {
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
        throw new Error(`Payment creation failed: ${response.status} ${response.statusText}`)
      }

      const payment: PayPalPaymentResponse = await response.json()
      console.log("PayPal payment created successfully:", payment.id)

      return payment
    } catch (error: any) {
      console.error("Error creating PayPal payment:", error)
      throw new Error(`Payment creation failed: ${error.message}`)
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<PayPalPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`${paypalConfig.baseUrl}/v1/payments/payment/${paymentId}/execute`, {
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
        throw new Error(`Payment execution failed: ${response.status} ${response.statusText}`)
      }

      const payment: PayPalPaymentResponse = await response.json()
      console.log("PayPal payment executed successfully:", payment.id)

      return payment
    } catch (error: any) {
      console.error("Error executing PayPal payment:", error)
      throw new Error(`Payment execution failed: ${error.message}`)
    }
  }

  async createPayout(
    recipientEmail: string,
    amount: number,
    currency: string,
    note: string,
  ): Promise<PayPalPayoutResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout!",
          email_message: note,
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: currency,
            },
            receiver: recipientEmail,
            note: note,
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }

      console.log("Creating PayPal payout:", payoutData)

      const response = await fetch(`${paypalConfig.baseUrl}/v1/payments/payouts`, {
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
        console.error("PayPal payout creation error:", errorText)
        throw new Error(`Payout creation failed: ${response.status} ${response.statusText}`)
      }

      const payout: PayPalPayoutResponse = await response.json()
      console.log("PayPal payout created successfully:", payout.batch_header.payout_batch_id)

      return payout
    } catch (error: any) {
      console.error("Error creating PayPal payout:", error)
      throw new Error(`Payout creation failed: ${error.message}`)
    }
  }

  async getPayment(paymentId: string): Promise<PayPalPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`${paypalConfig.baseUrl}/v1/payments/payment/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payment retrieval error:", errorText)
        throw new Error(`Payment retrieval failed: ${response.status} ${response.statusText}`)
      }

      const payment: PayPalPaymentResponse = await response.json()
      return payment
    } catch (error: any) {
      console.error("Error retrieving PayPal payment:", error)
      throw new Error(`Payment retrieval failed: ${error.message}`)
    }
  }
}

export const paypalClient = new PayPalClient()
