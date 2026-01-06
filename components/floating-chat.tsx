"use client"

import { useEffect } from "react"

export function FloatingChat() {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.$zoho = window.$zoho || {}
        window.$zoho.salesiq = window.$zoho.salesiq || {}
      }

      // Load the Zoho SalesIQ widget script
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.src = "https://salesiq.zoho.com/widget"
      script.async = true
      script.defer = true

      script.onerror = () => {
        console.log("[v0] Zoho SalesIQ widget failed to load (optional feature)")
      }

      script.onload = () => {
        console.log("[v0] Zoho SalesIQ widget loaded successfully")
      }

      document.body.appendChild(script)
    } catch (error) {
      // Silently fail if Zoho widget doesn't load - it's optional
      console.log("[v0] Zoho SalesIQ initialization skipped")
    }

    return () => {
      // Cleanup
    }
  }, [])

  return null // Zoho SalesIQ renders its own widget
}
