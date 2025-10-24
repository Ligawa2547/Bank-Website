"use client"

import { useEffect } from "react"

export function FloatingChat() {
  useEffect(() => {
    // Initialize Zoho SalesIQ
    window.$zoho = window.$zoho || {}
    window.$zoho.salesiq = window.$zoho.salesiq || {
      ready: () => {
        // Widget is ready
      },
    }

    // Load the Zoho SalesIQ widget script
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://salesiq.zoho.com/widget"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  return null // Zoho SalesIQ renders its own widget
}
