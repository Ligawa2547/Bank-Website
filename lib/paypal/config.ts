export const paypalConfig = {
  clientId:
    process.env.PAYPAL_CLIENT_ID || "Ac2-spXIWOCyR3ZQw708aZDaTqNd6IJ-qK7VZ-16cCP6BGjpgQgrs6i9jl3aLlppRlE7a6_KG_Q5BbQt",
  clientSecret:
    process.env.PAYPAL_CLIENT_SECRET ||
    "EOcK7JHYkj10RaNgZElyPdu-9eA2wRcKcfRd_s2vvlf7gnSgBKMPcGB-9AVGlehWxtl6lrX2Pw-tP5YI",
  baseUrl: process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  webUrl: process.env.NODE_ENV === "production" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com",
  returnUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/success`
    : "https://ebanking.iaenb.com/api/paypal/success",
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/cancel`
    : "https://ebanking.iaenb.com/api/paypal/cancel",
}
