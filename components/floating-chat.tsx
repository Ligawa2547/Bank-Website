"use client"

import { useEffect } from "react"

export function FloatingChat() {
  useEffect(() => {
    // Skip Zoho widget loading on client side if disabled
    const isWidgetDisabled = process.env.NEXT_PUBLIC_DISABLE_ZOHO_WIDGET === "true"
    if (isWidgetDisabled) {
      return
    }

    try {
      // Check if Zoho is already loaded to prevent duplicate loading
      if (typeof window !== "undefined" && !window.__zoho_loaded) {
        window.__zoho_loaded = true
        window.$zoho = window.$zoho || {}
        window.$zoho.salesiq = window.$zoho.salesiq || {}

        // Set up global error handler for widget
        const handleZohoError = (event: ErrorEvent) => {
          // Only log errors from Zoho, not all errors
          if (event.filename && event.filename.includes("zoho")) {
            console.warn("[v0] Zoho SalesIQ widget error:", event.message)
          }
        }

        window.addEventListener("error", handleZohoError, true)

        // Load the Zoho SalesIQ widget script with better error handling
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.src = "https://salesiq.zoho.com/widget"
        script.async = true
        script.defer = true
        script.crossOrigin = "anonymous"

        let scriptLoadTimeout: NodeJS.Timeout | null = null

        script.onerror = () => {
          console.warn("[v0] Zoho SalesIQ widget failed to load - this is optional and won't affect core functionality")
          window.__zoho_loaded = false
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
          window.removeEventListener("error", handleZohoError, true)
        }

        script.onload = () => {
          console.log("[v0] Zoho SalesIQ widget loaded successfully")
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
        }

        // Set a timeout to cleanup if script takes too long
        scriptLoadTimeout = setTimeout(() => {
          console.warn("[v0] Zoho SalesIQ widget load timeout - proceeding without it")
          window.__zoho_loaded = false
          window.removeEventListener("error", handleZohoError, true)
        }, 10000) // 10 second timeout

        document.body.appendChild(script)

        return () => {
          // Cleanup
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
          window.removeEventListener("error", handleZohoError, true)
        }
      }
    } catch (error) {
      console.warn("[v0] Zoho SalesIQ initialization error (optional feature):", error instanceof Error ? error.message : String(error))
    }
  }, [])

  return null // Zoho SalesIQ renders its own widget or nothing if disabled
}
