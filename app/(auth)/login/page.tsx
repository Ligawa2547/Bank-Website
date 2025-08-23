import type { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "Login - Secure Access to Your Account",
  description:
    "Securely log in to your IAE Bank account to access your finances, view balances, transfer money, and manage your banking needs online.",
  keywords: [
    "login",
    "sign in",
    "account access",
    "secure login",
    "online banking login",
    "IAE Bank login",
    "banking portal",
    "customer portal",
  ],
  openGraph: {
    title: "Login - IAE Bank",
    description:
      "Securely log in to your IAE Bank account to access your finances, view balances, transfer money, and manage your banking needs online.",
    url: "https://ebanking.iaenb.com/login",
  },
  twitter: {
    title: "Login - IAE Bank",
    description:
      "Securely log in to your IAE Bank account to access your finances, view balances, transfer money, and manage your banking needs online.",
  },
  alternates: {
    canonical: "/login",
  },
}

export default function LoginPage() {
  return <LoginClient />
}
