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
        
        // Show banner if there's any scheduled maintenance time set (not just when upcoming)
        if (result.scheduledStart && result.scheduledEnd) {
          const now = new Date()
          const start = new Date(result.scheduledStart)
          const end = new Date(result.scheduledEnd)
          const diffMs = start.getTime() - now.getTime()
          
          let timeUntilStart = ''
          let displayText = ''
          
          if (diffMs > 0) {
            // Maintenance hasn't started yet
            const diffMins = Math.floor(diffMs / 60000)
            const hours = Math.floor(diffMins / 60)
            const mins = diffMins % 60
            
            if (hours > 0) {
              timeUntilStart = `${hours}h ${mins}m`
            } else {
              timeUntilStart = `${mins}m`
            }
            displayText = `Scheduled Maintenance: We have scheduled maintenance in ${timeUntilStart}`
          } else if (now < end) {
            // Maintenance is currently active
            const remainingMs = end.getTime() - now.getTime()
            const remainingMins = Math.floor(remainingMs / 60000)
            const remainingHours = Math.floor(remainingMins / 60)
            const remainingSecs = Math.floor(remainingMins % 60)
            
            displayText = `Maintenance in Progress: Expected to end in ${remainingHours}h ${remainingSecs}m`
          } else {
            // Maintenance has ended
            setScheduledMaintenance(null)
            return
          }
          
          setScheduledMaintenance({
            isScheduled: true,
            isUpcoming: diffMs > 0,
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
    // Update banner every 30 seconds for more frequent updates
    const interval = setInterval(checkMaintenance, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (!scheduledMaintenance) {
    return null
  }

  return (
    <Alert className="rounded-none border-0 bg-yellow-50 border-b-2 border-yellow-400">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 ml-2">
        <strong>
          {scheduledMaintenance.isUpcoming ? 'Scheduled Maintenance' : 'Maintenance in Progress'}:
        </strong>
        {scheduledMaintenance.isUpcoming 
          ? ` We have scheduled maintenance in ${scheduledMaintenance.timeUntilStart}. Services may be temporarily unavailable during this time.`
          : ` System maintenance is currently in progress. Services may be temporarily unavailable.`
        }
      </AlertDescription>
    </Alert>
  )
}
