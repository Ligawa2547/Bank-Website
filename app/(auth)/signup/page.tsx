import { Suspense } from "react"
import SignupClient from "./signup-client"

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  )
}
