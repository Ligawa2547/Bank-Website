"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    __zoho_loaded?: boolean
    __zoho_error_handler_installed?: boolean
    $zoho?: any
  }
}

export function FloatingChat() {
  useEffect(() => {
    // Skip Zoho widget loading on client side if disabled (default to disabled due to compatibility issues)
    const isWidgetEnabled = process.env.NEXT_PUBLIC_ENABLE_ZOHO_WIDGET === "true"
    if (!isWidgetEnabled) {
      return
    }

    try {
      // Install global error handler to catch and suppress Zoho errors
      if (typeof window !== "undefined" && !window.__zoho_error_handler_installed) {
        window.__zoho_error_handler_installed = true

        // Wrap the entire Zoho loading in a try-catch to isolate errors
        const originalError = window.onerror
        window.onerror = function (msg: any, url: any, lineNo: any, colNo: any, error: any) {
          // Suppress errors from Zoho widget
          if (url && url.includes("zoho")) {
            console.warn("[v0] Suppressed Zoho SalesIQ error to prevent app crash:", msg)
            return true // Return true to prevent error propagation
          }
          // Call original error handler if it exists
          if (typeof originalError === "function") {
            return originalError(msg, url, lineNo, colNo, error)
          }
          return false
        }
      }

      // Check if Zoho is already loaded to prevent duplicate loading
      if (typeof window !== "undefined" && !window.__zoho_loaded) {
        window.__zoho_loaded = true
        window.$zoho = window.$zoho || {}
        window.$zoho.salesiq = window.$zoho.salesiq || {}

        // Load the Zoho SalesIQ widget script
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.src = "https://salesiq.zoho.com/widget"
        script.async = true
        script.defer = true
        script.crossOrigin = "anonymous"

        let scriptLoadTimeout: NodeJS.Timeout | null = null

        script.onerror = () => {
          console.warn("[v0] Zoho SalesIQ widget failed to load - continuing without it")
          window.__zoho_loaded = false
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
        }

        script.onload = () => {
          console.log("[v0] Zoho SalesIQ widget loaded")
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
        }

        // Set a timeout to cleanup if script takes too long
        scriptLoadTimeout = setTimeout(() => {
          console.warn("[v0] Zoho SalesIQ widget load timeout")
          window.__zoho_loaded = false
        }, 15000)

        document.body.appendChild(script)

        return () => {
          if (scriptLoadTimeout) clearTimeout(scriptLoadTimeout)
        }
      }
    } catch (error) {
      console.warn("[v0] Zoho SalesIQ initialization skipped:", error instanceof Error ? error.message : String(error))
    }
  }, [])

  return null // Zoho SalesIQ renders its own widget or nothing
}
