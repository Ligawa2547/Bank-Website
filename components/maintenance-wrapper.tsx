'use client'

import { useEffect, useState } from 'react'
import { checkMaintenanceMode } from '@/app/actions/check-maintenance'
import { MaintenancePage } from '@/app/maintenance'

interface MaintenanceWrapperProps {
  children: React.ReactNode
  allowedPaths?: string[]
}

export function MaintenanceWrapper({ children, allowedPaths = ['/admin/login'] }: MaintenanceWrapperProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [message, setMessage] = useState('System Maintenance')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const result = await checkMaintenanceMode()
        
        // Check if current path is allowed during maintenance
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        const isAllowedPath = allowedPaths.some(path => currentPath.startsWith(path))
        
        setIsMaintenanceMode(result.isMaintenanceMode && !isAllowedPath)
        setMessage(result.message)
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
        setIsMaintenanceMode(false)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenance()
    // Check every 30 seconds
    const interval = setInterval(checkMaintenance, 30000)
    
    return () => clearInterval(interval)
  }, [allowedPaths])

  if (loading) {
    return children
  }

  if (isMaintenanceMode) {
    return <MaintenancePage message={message} />
  }

  return children
}
