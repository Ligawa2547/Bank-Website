import { PAYPAL_CONFIG, validatePayPalConfig } from "./config"

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  nonce: string
}

interface PayPalErrorResponse {
  error: string
  error_description: string
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

let cachedToken: { token: string; expiresAt: number; environment: string } | null = null
let detectedEnvironment: "sandbox" | "production" | null = null

export class PayPalClient {
  private async detectEnvironment(): Promise<"sandbox" | "production"> {
    if (detectedEnvironment) {
      console.log("Using previously detected environment:", detectedEnvironment)
      return detectedEnvironment
    }

    console.log("=== Detecting PayPal Environment ===")

    // Try sandbox first
    try {
      console.log("Testing sandbox environment...")
      await this.testAuthentication(PAYPAL_CONFIG.SANDBOX_BASE_URL)
      console.log("✅ Sandbox authentication successful")
      detectedEnvironment = "sandbox"
      return "sandbox"
    } catch (sandboxError) {
      console.log(
        "❌ Sandbox authentication failed:",
        sandboxError instanceof Error ? sandboxError.message : sandboxError,
      )
    }

    // Try production
    try {
      console.log("Testing production environment...")
      await this.testAuthentication(PAYPAL_CONFIG.PRODUCTION_BASE_URL)
      console.log("✅ Production authentication successful")
      detectedEnvironment = "production"
      return "production"
    } catch (productionError) {
      console.log(
        "❌ Production authentication failed:",
        productionError instanceof Error ? productionError.message : productionError,
      )
    }

    throw new Error(
      "PayPal authentication failed in both sandbox and production environments. Please check your credentials.",
    )
  }

  private async testAuthentication(baseUrl: string): Promise<void> {
    const clientId = PAYPAL_CONFIG.CLIENT_ID.trim()
    const clientSecret = PAYPAL_CONFIG.CLIENT_SECRET.trim()
    const credentials = `${clientId}:${clientSecret}`
    const encodedCredentials = Buffer.from(credentials, "utf8").toString("base64")

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        Accept: "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Authentication failed: ${errorText}`)
    }

    const data = await response.json()
    if (!data.access_token) {
      throw new Error("No access token received")
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log("=== PayPal Authentication Debug ===")

      // Validate configuration first
      validatePayPalConfig()

      // Detect the correct environment
      const environment = await this.detectEnvironment()
      const baseUrl = environment === "sandbox" ? PAYPAL_CONFIG.SANDBOX_BASE_URL : PAYPAL_CONFIG.PRODUCTION_BASE_URL

      console.log("Using PayPal environment:", environment)
      console.log("Base URL:", baseUrl)

      // Check if we have a valid cached token for this environment
      if (cachedToken && Date.now() < cachedToken.expiresAt && cachedToken.environment === environment) {
        console.log("Using cached PayPal token for", environment)
        return cachedToken.token
      }

      console.log("Requesting new PayPal access token...")

      // Log environment variables (safely)
      console.log("Environment check:", {
        hasClientId: !!PAYPAL_CONFIG.CLIENT_ID,
        hasClientSecret: !!PAYPAL_CONFIG.CLIENT_SECRET,
        clientIdFromConfig: PAYPAL_CONFIG.CLIENT_ID?.substring(0, 10) + "...",
        clientSecretFromConfig: PAYPAL_CONFIG.CLIENT_SECRET?.substring(0, 10) + "...",
      })

      // Double-check our config values
      console.log("Config values:", {
        clientIdLength: PAYPAL_CONFIG.CLIENT_ID?.length,
        clientSecretLength: PAYPAL_CONFIG.CLIENT_SECRET?.length,
        baseUrl: baseUrl,
        clientIdStart: PAYPAL_CONFIG.CLIENT_ID?.substring(0, 10),
        clientSecretStart: PAYPAL_CONFIG.CLIENT_SECRET?.substring(0, 10),
      })

      // Create the basic auth header - ensure no extra characters
      const clientId = PAYPAL_CONFIG.CLIENT_ID.trim()
      const clientSecret = PAYPAL_CONFIG.CLIENT_SECRET.trim()
      const credentials = `${clientId}:${clientSecret}`
      const encodedCredentials = Buffer.from(credentials, "utf8").toString("base64")

      console.log("Credentials info:", {
        credentialsLength: credentials.length,
        encodedLength: encodedCredentials.length,
        encodedStart: encodedCredentials.substring(0, 20),
      })

      const tokenUrl = `${baseUrl}/v1/oauth2/token`
      console.log("Token URL:", tokenUrl)

      const headers = {
        Authorization: `Basic ${encodedCredentials}`,
        Accept: "application/json",
        "Accept-Language": "en_US",
        "Content-Type": "application/x-www-form-urlencoded",
      }

      console.log("Request headers:", {
        ...headers,
        Authorization: `Basic ${encodedCredentials.substring(0, 20)}...`,
      })

      const body = "grant_type=client_credentials"
      console.log("Request body:", body)

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers,
        body,
      })

      console.log("PayPal token response status:", response.status)
      console.log("PayPal token response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()
      console.log("PayPal token response body:", responseText)

      if (!response.ok) {
        let errorDetails: PayPalErrorResponse
        try {
          errorDetails = JSON.parse(responseText)
        } catch {
          errorDetails = { error: "unknown", error_description: responseText }
        }

        console.error("PayPal authentication failed:", {
          status: response.status,
          error: errorDetails.error,
          description: errorDetails.error_description,
          fullResponse: responseText,
          environment: environment,
        })

        // Provide specific error messages based on the error type
        if (errorDetails.error === "invalid_client") {
          throw new Error(
            `PayPal authentication failed in ${environment} environment: Invalid client credentials. Please verify your credentials are correct and active in your PayPal Developer Dashboard for the ${environment} environment.`,
          )
        }

        throw new Error(`PayPal authentication failed: ${errorDetails.error_description || errorDetails.error}`)
      }

      let data: PayPalTokenResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse PayPal token response:", parseError)
        throw new Error("Invalid response from PayPal token endpoint")
      }

      console.log("PayPal token received successfully:", {
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        scope: data.scope,
        tokenLength: data.access_token?.length,
        environment: environment,
      })

      // Cache the token (subtract 60 seconds for safety margin)
      cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
        environment: environment,
      }

      console.log("=== PayPal Authentication Success ===")
      return data.access_token
    } catch (error) {
      console.error("=== PayPal Authentication Error ===")
      console.error("Error getting PayPal access token:", error)
      throw error
    }
  }

  async createPayment(
    amount: number,
    paymentMethod: "paypal" | "card" = "paypal",
  ): Promise<{ paymentId: string; approvalUrl: string }> {
    try {
      console.log("=== Creating PayPal Payment ===")
      const token = await this.getAccessToken()
      const environment = detectedEnvironment || "sandbox"
      const baseUrl = environment === "sandbox" ? PAYPAL_CONFIG.SANDBOX_BASE_URL : PAYPAL_CONFIG.PRODUCTION_BASE_URL

      console.log("Creating PayPal payment:", { amount, paymentMethod, environment })

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
            description: `Deposit to ${PAYPAL_CONFIG.APP_NAME} account - ${paymentMethod === "card" ? "Card Payment" : "PayPal Payment"}`,
            custom: JSON.stringify({
              paymentMethod,
              timestamp: Date.now(),
            }),
          },
        ],
        application_context: {
          brand_name: PAYPAL_CONFIG.APP_NAME,
          landing_page: paymentMethod === "card" ? "billing" : "login",
          user_action: "pay_now",
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: "no_shipping",
        },
      }

      console.log("PayPal payment data:", JSON.stringify(paymentData, null, 2))

      const response = await fetch(`${baseUrl}/v1/payments/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      console.log("PayPal payment creation response status:", response.status)

      const responseText = await response.text()
      console.log("PayPal payment creation response:", responseText)

      if (!response.ok) {
        console.error("PayPal payment creation error:", responseText)
        throw new Error(`Failed to create PayPal payment: ${responseText}`)
      }

      let payment: PayPalPayment
      try {
        payment = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse PayPal payment response:", parseError)
        throw new Error("Invalid response from PayPal payment endpoint")
      }

      console.log("PayPal payment created:", {
        id: payment.id,
        state: payment.state,
        linksCount: payment.links?.length || 0,
      })

      const approvalUrl = payment.links?.find((link) => link.rel === "approval_url")?.href
      if (!approvalUrl) {
        console.error("PayPal payment links:", payment.links)
        throw new Error("No approval URL found in PayPal response")
      }

      console.log("PayPal approval URL:", approvalUrl)
      console.log("=== PayPal Payment Creation Success ===")

      return {
        paymentId: payment.id,
        approvalUrl,
      }
    } catch (error) {
      console.error("=== PayPal Payment Creation Error ===")
      console.error("Error creating PayPal payment:", error)
      throw error
    }
  }

  async executePayment(paymentId: string, payerId: string): Promise<PayPalPayment> {
    try {
      const token = await this.getAccessToken()
      const environment = detectedEnvironment || "sandbox"
      const baseUrl = environment === "sandbox" ? PAYPAL_CONFIG.SANDBOX_BASE_URL : PAYPAL_CONFIG.PRODUCTION_BASE_URL

      console.log("Executing PayPal payment:", { paymentId, payerId, environment })

      const response = await fetch(`${baseUrl}/v1/payments/payment/${paymentId}/execute`, {
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

      console.log("PayPal payment execution response status:", response.status)

      const responseText = await response.text()
      if (!response.ok) {
        console.error("PayPal payment execution error:", responseText)
        throw new Error(`Failed to execute PayPal payment: ${responseText}`)
      }

      const payment: PayPalPayment = JSON.parse(responseText)
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
      const environment = detectedEnvironment || "sandbox"
      const baseUrl = environment === "sandbox" ? PAYPAL_CONFIG.SANDBOX_BASE_URL : PAYPAL_CONFIG.PRODUCTION_BASE_URL

      console.log("Creating PayPal payout:", { amount, email, environment })

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: "You have a payout!",
          email_message: `You have received a payout from ${PAYPAL_CONFIG.APP_NAME}.`,
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: "USD",
            },
            receiver: email,
            note: `Withdrawal from ${PAYPAL_CONFIG.APP_NAME}`,
            sender_item_id: `item_${Date.now()}`,
          },
        ],
      }

      const response = await fetch(`${baseUrl}/v1/payments/payouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payoutData),
      })

      const responseText = await response.text()
      if (!response.ok) {
        console.error("PayPal payout creation error:", responseText)
        throw new Error(`Failed to create PayPal payout: ${responseText}`)
      }

      const payout: PayPalPayout = JSON.parse(responseText)
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
      const environment = detectedEnvironment || "sandbox"
      const baseUrl = environment === "sandbox" ? PAYPAL_CONFIG.SANDBOX_BASE_URL : PAYPAL_CONFIG.PRODUCTION_BASE_URL

      const response = await fetch(`${baseUrl}/v1/payments/payment/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      const responseText = await response.text()
      if (!response.ok) {
        throw new Error(`Failed to get PayPal payment: ${responseText}`)
      }

      return JSON.parse(responseText)
    } catch (error) {
      console.error("Error getting PayPal payment:", error)
      throw error
    }
  }
}

export const paypalClient = new PayPalClient()
