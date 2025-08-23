import type { Metadata } from "next"
import SignupClient from "./signup-client"

export const metadata: Metadata = {
  title: "Sign Up - Open Your Account Today",
  description:
    "Join IAE Bank today and open your new account. Enjoy secure online banking, competitive rates, and exceptional customer service.",
  keywords: [
    "sign up",
    "create account",
    "open account",
    "new customer",
    "bank account registration",
    "IAE Bank signup",
    "online account opening",
    "banking registration",
  ],
  openGraph: {
    title: "Sign Up - IAE Bank",
    description:
      "Join IAE Bank today and open your new account. Enjoy secure online banking, competitive rates, and exceptional customer service.",
    url: "https://ebanking.iaenb.com/signup",
  },
  twitter: {
    title: "Sign Up - IAE Bank",
    description:
      "Join IAE Bank today and open your new account. Enjoy secure online banking, competitive rates, and exceptional customer service.",
  },
  alternates: {
    canonical: "/signup",
  },
}

export default function SignupPage() {
  return <SignupClient />
}
