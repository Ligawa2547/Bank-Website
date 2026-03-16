'use client'

import { useEffect, useState } from 'react'
import { checkMaintenanceMode } from '@/app/actions/check-maintenance'
import { MaintenancePage } from '@/app/maintenance'

interface MaintenanceWrapperProps {
  children: React.ReactNode
  allowedPaths?: string[]
}

export function MaintenanceWrapper({ children, allowedPaths = [] }: MaintenanceWrapperProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [message, setMessage] = useState('System Maintenance')
  const [scheduledStart, setScheduledStart] = useState<string | null>(null)
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const result = await checkMaintenanceMode()
        
        // Check if current path is allowed during maintenance
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        
        // Always allow all admin paths to bypass maintenance mode
        const isAdminPath = currentPath.startsWith('/admin')
        // Also check any additional allowed paths
        const isAllowedPath = isAdminPath || allowedPaths.some(path => currentPath.startsWith(path))
        
        setIsMaintenanceMode(result.isMaintenanceMode && !isAllowedPath)
        setMessage(result.message)
        setScheduledStart(result.scheduledStart)
        setScheduledEnd(result.scheduledEnd)
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
        setIsMaintenanceMode(false)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenance()
    // Check every 10 seconds for more responsive scheduled maintenance detection
    const interval = setInterval(checkMaintenance, 10000)
    
    return () => clearInterval(interval)
  }, [allowedPaths])

  if (loading) {
    return children
  }

  if (isMaintenanceMode) {
    return <MaintenancePage message={message} scheduledStart={scheduledStart} scheduledEnd={scheduledEnd} />
  }

  return children
}
