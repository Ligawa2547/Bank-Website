import LoginClient from "./login-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Access Your Account",
  description:
    "Securely login to your I&E National Bank account. Access your dashboard, view transactions, transfer money, and manage your banking needs online.",
  keywords: ["login", "sign in", "online banking", "secure login", "bank account access"],
  openGraph: {
    title: "Login - I&E National Bank",
    description: "Securely access your banking account online",
    url: "/login",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginPage() {
  return <LoginClient />
}
