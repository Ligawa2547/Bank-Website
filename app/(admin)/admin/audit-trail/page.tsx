'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LogIn, ActivitySquare, AlertTriangle, Mail, Filter, Search, Download } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AuditLog {
  id: number
  user_id: string | null
  admin_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  description: string | null
  ip_address: string | null
  user_agent: string | null
  status: string
  timestamp: string
}

interface LoginLog {
  id: number
  user_id: string
  email: string
  ip_address: string
  user_agent: string | null
  login_method: string
  success: boolean
  failure_reason: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  country: string | null
  city: string | null
  timestamp: string
}

interface AdminActivity {
  id: number
  admin_id: string
  email: string | null
  action: string
  target_user_id: string | null
  target_email: string | null
  details: any
  ip_address: string | null
  impact: string
  timestamp: string
}

interface SecurityEvent {
  id: number
  user_id: string | null
  event_type: string
  severity: string
  description: string
  ip_address: string | null
  resolved: boolean
  timestamp: string
}

export default function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState('audit-logs')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [adminActivities, setAdminActivities] = useState<AdminActivity[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [dateRange, setDateRange] = useState('7days')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchAuditData()
  }, [dateRange, searchQuery, filterAction])

  const getDateFilter = () => {
    const now = new Date()
    const daysMap: Record<string, Date> = {
      '1day': new Date(now.setDate(now.getDate() - 1)),
      '7days': new Date(now.setDate(now.getDate() - 7)),
      '30days': new Date(now.setDate(now.getDate() - 30)),
      '90days': new Date(now.setDate(now.getDate() - 90)),
    }
    return daysMap[dateRange] || new Date(now.setDate(now.getDate() - 7))
  }

  const fetchAuditData = async () => {
    setLoading(true)
    const dateFilter = getDateFilter()

    try {
      // Fetch audit logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', dateFilter.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100)

      if (auditData) setAuditLogs(auditData)

      // Fetch login logs
      const { data: loginData } = await supabase
        .from('login_logs')
        .select('*')
        .gte('timestamp', dateFilter.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100)

      if (loginData) setLoginLogs(loginData)

      // Fetch admin activities
      const { data: adminData } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .gte('timestamp', dateFilter.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100)

      if (adminData) setAdminActivities(adminData)

      // Fetch security events
      const { data: securityData } = await supabase
        .from('security_events')
        .select('*')
        .gte('timestamp', dateFilter.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100)

      if (securityData) setSecurityEvents(securityData)
    } catch (error) {
      console.error('[v0] Failed to fetch audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failure':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Trail</h1>
        <p className="text-muted-foreground">Monitor all system activity, login events, and security incidents</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              placeholder="Search by email, IP, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => fetchAuditData()}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="login-logs" className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Logins
          </TabsTrigger>
          <TabsTrigger value="admin-activity" className="flex items-center gap-2">
            <ActivitySquare className="h-4 w-4" />
            Admin Actions
          </TabsTrigger>
          <TabsTrigger value="security-events" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Security Events
          </TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">System Activity Logs</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(auditLogs, 'audit-logs.csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No audit logs found
                </CardContent>
              </Card>
            ) : (
              auditLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Action</p>
                        <p className="font-semibold">{log.action}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusBadgeColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{log.ip_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timestamp</p>
                        <p className="text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      {log.description && (
                        <div className="col-span-full">
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm">{log.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Login Logs Tab */}
        <TabsContent value="login-logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Login Activity</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(loginLogs, 'login-logs.csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="space-y-2">
            {loginLogs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No login logs found
                </CardContent>
              </Card>
            ) : (
              loginLogs.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{log.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{log.ip_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-sm">{log.city && log.country ? `${log.city}, ${log.country}` : 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Device</p>
                        <p className="text-sm">{log.device_type || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timestamp</p>
                        <p className="text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Admin Activity Tab */}
        <TabsContent value="admin-activity" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Admin Actions</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(adminActivities, 'admin-activity.csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="space-y-2">
            {adminActivities.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No admin activities found
                </CardContent>
              </Card>
            ) : (
              adminActivities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Admin Email</p>
                        <p className="font-semibold">{activity.email || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Action</p>
                        <p className="font-semibold">{activity.action}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Target User</p>
                        <p className="text-sm">{activity.target_email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impact</p>
                        <Badge className={
                          activity.impact === 'high' ? 'bg-red-100 text-red-800' :
                          activity.impact === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {activity.impact}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{activity.ip_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timestamp</p>
                        <p className="text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security-events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Security Events</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(securityEvents, 'security-events.csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="space-y-2">
            {securityEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No security events found
                </CardContent>
              </Card>
            ) : (
              securityEvents.map((event) => (
                <Card key={event.id} className={`hover:shadow-md transition-shadow ${
                  event.severity === 'high' ? 'border-red-200' :
                  event.severity === 'medium' ? 'border-orange-200' :
                  'border-blue-200'
                }`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Event Type</p>
                        <p className="font-semibold">{event.event_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Severity</p>
                        <Badge className={getSeverityBadgeColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{event.description}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{event.ip_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={event.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {event.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Timestamp</p>
                        <p className="text-sm">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
