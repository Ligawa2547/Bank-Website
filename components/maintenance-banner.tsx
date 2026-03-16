'use client'

import { useEffect, useState } from 'react'
import { checkMaintenanceMode } from '@/app/actions/check-maintenance'
import { AlertCircle, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function MaintenanceBanner() {
  const [scheduledMaintenance, setScheduledMaintenance] = useState<{
    isScheduled: boolean
    isUpcoming: boolean
    startTime: string | null
    endTime: string | null
    timeUntilStart: string
  } | null>(null)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const result = await checkMaintenanceMode()
        
        if (result.isScheduled && result.scheduledStart) {
          const now = new Date()
          const start = new Date(result.scheduledStart)
          const diffMs = start.getTime() - now.getTime()
          
          let timeUntilStart = ''
          if (diffMs > 0) {
            const diffMins = Math.floor(diffMs / 60000)
            const hours = Math.floor(diffMins / 60)
            const mins = diffMins % 60
            
            if (hours > 0) {
              timeUntilStart = `${hours}h ${mins}m`
            } else {
              timeUntilStart = `${mins}m`
            }
          }
          
          setScheduledMaintenance({
            isScheduled: result.isScheduled,
            isUpcoming: result.isScheduledUpcoming,
            startTime: result.scheduledStart,
            endTime: result.scheduledEnd,
            timeUntilStart,
          })
        } else {
          setScheduledMaintenance(null)
        }
      } catch (error) {
        console.error('Error checking maintenance:', error)
      }
    }

    checkMaintenance()
    // Update banner every minute
    const interval = setInterval(checkMaintenance, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (!scheduledMaintenance?.isUpcoming) {
    return null
  }

  return (
    <Alert className="rounded-none border-0 bg-yellow-50 border-b-2 border-yellow-400">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 ml-2">
        <strong>Scheduled Maintenance:</strong> We have scheduled maintenance in {scheduledMaintenance.timeUntilStart}. 
        Services may be temporarily unavailable during this time.
      </AlertDescription>
    </Alert>
  )
}
