import type { Metadata } from "next"
import SignupClientPage from "./signup-client-page"

export const metadata: Metadata = {
  title: "Sign Up - Create Your Account",
  description:
    "Create your I&E National Bank account today. Enjoy secure online banking, easy transfers, savings accounts, and comprehensive financial services.",
  keywords: ["sign up", "create account", "register", "new account", "online banking registration"],
  openGraph: {
    title: "Sign Up - I&E National Bank",
    description: "Create your secure banking account today",
    url: "/signup",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupPage() {
  return <SignupClientPage />
}
