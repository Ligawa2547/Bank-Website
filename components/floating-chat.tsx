"use client"

import { useEffect } from "react"

export function FloatingChat() {
  useEffect(() => {
    try {
      window.$zoho = window.$zoho || {}
      window.$zoho.salesiq = window.$zoho.salesiq || {
        ready: () => {
          // Widget is ready - you can add custom configurations here
        },
      }

      // Load the Zoho SalesIQ widget script
      const script = document.createElement("script")
      script.type = "text/javascript"
      script.src = "https://salesiq.zoho.com/widget"
      script.async = true
      script.defer = true

      script.onerror = () => {
        console.error("[v0] Failed to load Zoho SalesIQ widget")
      }

      script.onload = () => {
        console.log("[v0] Zoho SalesIQ widget loaded successfully")
      }

      document.body.appendChild(script)
    } catch (error) {
      console.error("[v0] Error initializing Zoho SalesIQ:", error)
    }

    return () => {
      // Cleanup - remove script on unmount if needed
    }
  }, [])

  return null // Zoho SalesIQ renders its own widget
}
