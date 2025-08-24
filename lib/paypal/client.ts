import { paypalConfig, paypalEndpoints } from "./config"

class PayPalClient {
  private accessToken: string | null = null
  private tokenExpiry = 0

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const auth = Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString("base64")

      console.log("Getting PayPal access token...")
      console.log("Base URL:", paypalConfig.baseUrl)
      console.log("Client ID:", paypalConfig.clientId.substring(0, 10) + "...")

      const response = await fetch(`${paypalConfig.baseUrl}${paypalEndpoints.token}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "Accept-Language": "en_US",
        },
        body: "grant_type=client_credentials",
      })

      console.log("Token response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Token error response:", errorText)
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log("Token response:", {
        access_token: data.access_token ? "received" : "missing",
        expires_in: data.expires_in,
      })

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early

      return this.accessToken
    } catch (error) {
      console.error("Error getting PayPal access token:", error)
      throw error
    }
  }

  async createPayment(amount: number, currency = "USD", description: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/success`
      const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/cancel`

      console.log("Creating PayPal payment...")
      console.log("Amount:", amount, "Currency:", currency)
      console.log("Return URL:", returnUrl)
      console.log("Cancel URL:", cancelUrl)

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
            item_list: {
              items: [
                {
                  name: description,
                  sku: "deposit",
                  price: amount.toFixed(2),
                  currency: currency,
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: currency,
              total: amount.toFixed(2),
            },
            description: description,
          },
        ],
      }

      const response = await fetch(`${paypalConfig.baseUrl}${paypalEndpoints.payments}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      console.log("Payment creation response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Payment creation error:", errorData)
        throw new Error(`PayPal payment creation failed: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Payment created successfully:", result.id)
      return result
    } catch (error) {
      console.error("Error creating PayPal payment:", error)
      throw error
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      console.log("Executing PayPal payment:", paymentId, "for payer:", payerId)

      const response = await fetch(`${paypalConfig.baseUrl}${paypalEndpoints.payments}/${paymentId}/execute`, {
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

      console.log("Payment execution response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Payment execution error:", errorData)
        throw new Error(`PayPal payment execution failed: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Payment executed successfully:", result.id)
      return result
    } catch (error) {
      console.error("Error executing PayPal payment:", error)
      throw error
    }
  }

  async createPayout(recipientEmail: string, amount: number, currency = "USD", note: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      console.log("Creating PayPal payout to:", recipientEmail, "amount:", amount)

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout!",
          email_message: "You have received a payout! Thanks for using our service!",
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

      const response = await fetch(`${paypalConfig.baseUrl}${paypalEndpoints.payouts}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payoutData),
      })

      console.log("Payout creation response status:", response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Payout creation error:", errorData)
        throw new Error(`PayPal payout creation failed: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const result = await response.json()
      console.log("Payout created successfully:", result.batch_header.payout_batch_id)
      return result
    } catch (error) {
      console.error("Error creating PayPal payout:", error)
      throw error
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(`${paypalConfig.baseUrl}${paypalEndpoints.payments}/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Payment retrieval error:", errorData)
        throw new Error(`PayPal payment retrieval failed: ${response.status} ${response.statusText} - ${errorData}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error getting PayPal payment:", error)
      throw error
    }
  }
}

export const paypalClient = new PayPalClient()
