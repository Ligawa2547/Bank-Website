"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, [])
  return <main className="flex min-h-screen items-center justify-center px-6"><div className="max-w-md text-center"><h1 className="text-3xl font-bold">Something went wrong</h1><p className="mt-3 text-muted-foreground">We could not load this page. Please try again.</p><Button className="mt-6" onClick={() => reset()}>Try again</Button></div></main>
}
