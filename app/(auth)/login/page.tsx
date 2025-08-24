import type { Metadata } from "next"
import LoginClient from "./login-client"

export const metadata: Metadata = {
  title: "Login - Access Your Account",
  description:
    "Securely log in to your IAE Bank account to manage your finances, view transactions, and access all banking services.",
  keywords: ["login", "sign in", "account access", "secure login", "banking login"],
  openGraph: {
    title: "Login - IAE Bank",
    description: "Securely access your IAE Bank account",
    url: "https://ebanking.iaenb.com/login",
  },
  alternates: {
    canonical: "https://ebanking.iaenb.com/login",
  },
}

export default function LoginPage() {
  return <LoginClient />
}
