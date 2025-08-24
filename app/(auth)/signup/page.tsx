import type { Metadata } from "next"
import SignupClient from "./signup-client"

export const metadata: Metadata = {
  title: "Sign Up - Create Your Account",
  description:
    "Join IAE Bank today and enjoy secure online banking, easy money transfers, competitive loan rates, and comprehensive financial services.",
  keywords: ["sign up", "create account", "register", "new account", "join bank"],
  openGraph: {
    title: "Sign Up - IAE Bank",
    description: "Create your secure IAE Bank account today",
    url: "https://ebanking.iaenb.com/signup",
  },
  alternates: {
    canonical: "https://ebanking.iaenb.com/signup",
  },
}

export default function SignupPage() {
  return <SignupClient />
}
