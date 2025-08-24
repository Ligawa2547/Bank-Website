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
  cart: string
  payer: {
    payment_method: string
    status: string
    payer_info: {
      email: string
      first_name: string
      last_name: string
      payer_id: string
      shipping_address: any
      country_code: string
    }
  }
  transactions: Array<{
    amount: {
      total: string
      currency: string
      details: {
        subtotal: string
      }
    }
    payee: {
      merchant_id: string
    }
    description: string
    custom: string
    invoice_number: string
    payment_options: {
      allowed_payment_method: string
    }
    soft_descriptor: string
    item_list: {
      items: Array<{
        name: string
        sku: string
        price: string
        currency: string
        quantity: number
      }>
    }
    related_resources: Array<{
      sale: {
        id: string
        state: string
        amount: {
          total: string
          currency: string
          details: {
            subtotal: string
          }
        }
        payment_mode: string
        protection_eligibility: string
        protection_eligibility_type: string
        transaction_fee: {
          value: string
          currency: string
        }
        parent_payment: string
        create_time: string
        update_time: string
        links: Array<{
          href: string
          rel: string
          method: string
        }>
      }
    }>
  }>
  links: Array<{
    href: string
    rel: string
    method: string
  }>
  create_time: string
  update_time: string
}

interface PayPalPayout {
  batch_header: {
    payout_batch_id: string
    batch_status: string
    time_created: string
    time_completed: string
    sender_batch_header: {
      sender_batch_id: string
      email_subject: string
      email_message: string
    }
    amount: {
      currency: string
      value: string
    }
    fees: {
      currency: string
      value: string
    }
  }
  items: Array<{
    payout_item_id: string
    transaction_id: string
    transaction_status: string
    payout_item_fee: {
      currency: string
      value: string
    }
    payout_batch_id: string
    sender_batch_id: string
    payout_item: {
      recipient_type: string
      amount: {
        currency: string
        value: string
      }
      note: string
      receiver: string
      sender_item_id: string
    }
    time_processed: string
    links: Array<{
      href: string
      rel: string
      method: string
    }>
  }>
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

let cachedToken: { token: string; expiresAt: number } | null = null

export class PayPalClient {
  private async getAccessToken(): Promise<string> {
    try {
      validatePayPalConfig()

      // Check if we have a valid cached token
      if (cachedToken && Date.now() < cachedToken.expiresAt) {
        console.log("Using cached PayPal token")
        return cachedToken.token
      }

      console.log("Requesting new PayPal access token...")

      const auth = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Accept-Language": "en_US",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal token error response:", errorText)
        throw new Error(`Failed to get PayPal access token: ${errorText}`)
      }

      const data: PayPalTokenResponse = await response.json()
      console.log("PayPal token received:", {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
      })

      // Cache the token (subtract 60 seconds for safety margin)
      cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      }

      return data.access_token
    } catch (error) {
      console.error("Error getting PayPal access token:", error)
      throw error
    }
  }

  async createPayment(
    amount: number,
    paymentMethod: "paypal" | "card" = "paypal",
  ): Promise<{ paymentId: string; approvalUrl: string }> {
    try {
      const token = await this.getAccessToken()

      console.log("Creating PayPal payment:", { amount, paymentMethod })

      const returnUrl = `${PAYPAL_CONFIG.APP_URL}/api/paypal/success`
      const cancelUrl = `${PAYPAL_CONFIG.APP_URL}/api/paypal/cancel`

      console.log("PayPal return URLs:", { returnUrl, cancelUrl })

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
            description: `Deposit to account - ${paymentMethod === "card" ? "Card Payment" : "PayPal Payment"}`,
            custom: JSON.stringify({
              paymentMethod,
              timestamp: Date.now(),
            }),
          },
        ],
        application_context: {
          brand_name: "IAE National Bank",
          landing_page: paymentMethod === "card" ? "billing" : "login",
          user_action: "pay_now",
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: "no_shipping",
        },
      }

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
      console.log("PayPal payment created:", {
        id: payment.id,
        state: payment.state,
      })

      const approvalUrl = payment.links.find((link) => link.rel === "approval_url")?.href
      if (!approvalUrl) {
        throw new Error("No approval URL found in PayPal response")
      }

      console.log("PayPal approval URL:", approvalUrl)

      return {
        paymentId: payment.id,
        approvalUrl,
      }
    } catch (error) {
      console.error("Error creating PayPal payment:", error)
      throw error
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<PayPalPayment> {
    try {
      const token = await this.getAccessToken()

      console.log("Executing PayPal payment:", { paymentId, payerId })

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

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payment execution error:", errorText)
        throw new Error(`Failed to execute PayPal payment: ${errorText}`)
      }

      const payment: PayPalPayment = await response.json()
      console.log("PayPal payment executed:", {
        id: payment.id,
        state: payment.state,
      })

      return payment
    } catch (error) {
      console.error("Error executing PayPal payment:", error)
      throw error
    }
  }

  async createPayout(amount: number, email: string): Promise<PayPalPayout> {
    try {
      const token = await this.getAccessToken()

      console.log("Creating PayPal payout:", { amount, email })

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout!",
          email_message: "You have received a payout from IAE National Bank.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: "USD",
            },
            receiver: email,
            note: "Withdrawal from IAE National Bank",
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payoutData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PayPal payout creation error:", errorText)
        throw new Error(`Failed to create PayPal payout: ${errorText}`)
      }

      const payout: PayPalPayout = await response.json()
      console.log("PayPal payout created:", {
        batchId: payout.batch_header.payout_batch_id,
        status: payout.batch_header.batch_status,
      })

      return payout
    } catch (error) {
      console.error("Error creating PayPal payout:", error)
      throw error
    }
  }

  async getPayment(paymentId: string): Promise<PayPalPayment> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${PAYPAL_CONFIG.BASE_URL}/v1/payments/payment/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get PayPal payment: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting PayPal payment:", error)
      throw error
    }
  }
}

export const paypalClient = new PayPalClient()
