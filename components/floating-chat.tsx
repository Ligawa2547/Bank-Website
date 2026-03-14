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
    // Zoho widget is disabled by default due to script tag rendering issues and compatibility problems
    // If you need to enable it in the future, set NEXT_PUBLIC_ENABLE_ZOHO_WIDGET=true in environment variables
    // For now, this component does nothing and returns null to avoid any widget-related errors
  }, [])

  return null
}
