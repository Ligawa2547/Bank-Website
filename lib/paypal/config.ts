export const paypalConfig = {
  clientId:
    process.env.PAYPAL_CLIENT_ID || "Ac2-spXIWOCyR3ZQw708aZDaTqNd6IJ-qK7VZ-16cCP6BGjpgQgrs6i9jl3aLlppRlE7a6_KG_Q5BbQt",
  clientSecret:
    process.env.PAYPAL_CLIENT_SECRET ||
    "EOcK7JHYkj10RaNgZElyPdu-9eA2wRcKcfRd_s2vvlf7gnSgBKMPcGB-9AVGlehWxtl6lrX2Pw-tP5YI",
  baseUrl: process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  mode: process.env.NODE_ENV === "production" ? "live" : "sandbox",
}

export const paypalEndpoints = {
  token: "/v1/oauth2/token",
  payments: "/v1/payments/payment",
  payouts: "/v1/payments/payouts",
  webhooks: "/v1/notifications/webhooks",
}
