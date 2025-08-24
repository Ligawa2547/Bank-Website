import { PAYPAL_CONFIG, getPayPalBaseUrl, setDetectedEnvironment } from "./config"

export class PayPalClient {
  private accessToken: string | null = null
  private tokenExpiry = 0

  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Try to get new token, with environment detection
    return await this.authenticateWithEnvironmentDetection()
  }

  private async authenticateWithEnvironmentDetection(): Promise<string> {
    const environments = [
      { name: "sandbox" as const, url: PAYPAL_CONFIG.SANDBOX_BASE_URL },
      { name: "production" as const, url: PAYPAL_CONFIG.PRODUCTION_BASE_URL },
    ]

    // If we already detected an environment, try it first
    if (PAYPAL_CONFIG.DETECTED_ENVIRONMENT) {
      const detectedEnv = environments.find((env) => env.name === PAYPAL_CONFIG.DETECTED_ENVIRONMENT)
      if (detectedEnv) {
        try {
          console.log(`🔄 Trying detected environment: ${detectedEnv.name}`)
          return await this.authenticate(detectedEnv.url, detectedEnv.name)
        } catch (error) {
          console.log(`❌ Detected environment ${detectedEnv.name} failed, trying others...`)
        }
      }
    }

    // Try each environment until one works
    for (const env of environments) {
      if (env.name === PAYPAL_CONFIG.DETECTED_ENVIRONMENT) continue // Skip already tried

      try {
        console.log(`🔄 Trying PayPal ${env.name} environment...`)
        const token = await this.authenticate(env.url, env.name)
        setDetectedEnvironment(env.name)
        return token
      } catch (error) {
        console.log(`❌ PayPal ${env.name} authentication failed:`, error)
        continue
      }
    }

    throw new Error(
      "PayPal authentication failed in both sandbox and production environments. Please check your credentials.",
    )
  }

  private async authenticate(baseUrl: string, environment: "sandbox" | "production"): Promise<string> {
    const credentials = Buffer.from(`${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`).toString("base64")

    console.log(`🔐 Authenticating with PayPal ${environment}...`)
    console.log(`📍 Base URL: ${baseUrl}`)
    console.log(`🔑 Client ID: ${PAYPAL_CONFIG.CLIENT_ID.substring(0, 20)}...`)

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ PayPal ${environment} auth failed:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`PayPal authentication failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ PayPal ${environment} authentication successful!`)

    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // Refresh 1 minute early

    return this.accessToken
  }

  async createOrder(amount: number, currency = "USD"): Promise<any> {
    const accessToken = await this.getAccessToken()
    const baseUrl = getPayPalBaseUrl()

    console.log(`💳 Creating PayPal order for ${currency} ${amount}`)

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description: "Bank Account Deposit",
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "UNRESTRICTED",
            brand_name: "IAE Bank",
            locale: "en-US",
            landing_page: "LOGIN",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${PAYPAL_CONFIG.APP_URL}/api/paypal/success`,
            cancel_url: `${PAYPAL_CONFIG.APP_URL}/api/paypal/cancel`,
          },
        },
      },
    }

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ PayPal order creation failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`Failed to create PayPal order: ${response.status}`)
    }

    const order = await response.json()
    console.log("✅ PayPal order created:", order.id)

    return order
  }

  async captureOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const baseUrl = getPayPalBaseUrl()

    console.log(`💰 Capturing PayPal order: ${orderId}`)

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ PayPal order capture failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`Failed to capture PayPal order: ${response.status}`)
    }

    const result = await response.json()
    console.log("✅ PayPal order captured successfully")

    return result
  }

  async getOrderDetails(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const baseUrl = getPayPalBaseUrl()

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get PayPal order details: ${response.status}`)
    }

    return await response.json()
  }
}

// Export singleton instance
export const paypalClient = new PayPalClient()
