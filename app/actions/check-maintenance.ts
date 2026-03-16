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
      .eq('category', 'general')
      .single()

    if (error || !data) {
      return {
        isMaintenanceMode: false,
        message: 'System Maintenance',
      }
    }

    const settings = data.settings as any
    return {
      isMaintenanceMode: settings?.maintenance_mode === true,
      message: settings?.maintenance_message || 'System Maintenance',
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return {
      isMaintenanceMode: false,
      message: 'System Maintenance',
    }
  }
}
