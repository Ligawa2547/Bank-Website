'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function checkMaintenanceMode() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('settings')
      .in('category', ['general', 'maintenance'])

    if (error || !data) {
      return {
        isMaintenanceMode: false,
        isScheduled: false,
        message: 'System Maintenance',
        scheduledStart: null,
        scheduledEnd: null,
      }
    }

    // Get general settings and maintenance settings
    const generalSettings = data.find((item: any) => item.category === 'general')?.settings as any || {}
    const maintenanceSettings = data.find((item: any) => item.category === 'maintenance')?.settings as any || {}

    const now = new Date()
    const scheduledStart = maintenanceSettings?.maintenance_start ? new Date(maintenanceSettings.maintenance_start) : null
    const scheduledEnd = maintenanceSettings?.maintenance_end ? new Date(maintenanceSettings.maintenance_end) : null

    // Check if immediate maintenance mode is enabled
    const immediateMode = generalSettings?.maintenance_mode === true

    // Check if scheduled maintenance is active (current time is within scheduled window)
    const isScheduledActive = scheduledStart && scheduledEnd && now >= scheduledStart && now <= scheduledEnd
    
    // Check if scheduled maintenance is upcoming (within next 24 hours)
    const isScheduledUpcoming = scheduledStart && (scheduledStart.getTime() - now.getTime()) < 24 * 60 * 60 * 1000 && (scheduledStart.getTime() - now.getTime()) > 0

    return {
      isMaintenanceMode: immediateMode || isScheduledActive,
      isScheduled: maintenanceSettings?.scheduled_maintenance === true,
      isScheduledActive: isScheduledActive,
      isScheduledUpcoming: isScheduledUpcoming,
      message: isScheduledActive 
        ? (maintenanceSettings?.maintenance_message || 'System Maintenance')
        : (generalSettings?.maintenance_message || 'System Maintenance'),
      scheduledStart: scheduledStart?.toISOString() || null,
      scheduledEnd: scheduledEnd?.toISOString() || null,
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return {
      isMaintenanceMode: false,
      isScheduled: false,
      message: 'System Maintenance',
      scheduledStart: null,
      scheduledEnd: null,
    }
  }
}
