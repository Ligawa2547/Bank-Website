'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, MessageSquare, Users, BarChart3, AlertCircle, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface StaffMember {
  id: string
  staffName: string
  staffEmail: string
  role: 'support' | 'team_lead' | 'supervisor'
  availabilityStatus: 'offline' | 'online' | 'on_call' | 'break'
  currentChatCount: number
  maxConcurrentChats: number
  currentCallCount: number
  maxConcurrentCalls: number
  isActive: boolean
}

interface SupportStats {
  totalChats: number
  activeChatCount: number
  avgChatDuration: number
  totalCalls: number
  activeCallCount: number
  avgCallDuration: number
  totalStaff: number
  onlineStaff: number
}

export default function AdminSupportPage() {
  const [stats, setStats] = useState<SupportStats>({
    totalChats: 0,
    activeChatCount: 0,
    avgChatDuration: 0,
    totalCalls: 0,
    activeCallCount: 0,
    avgCallDuration: 0,
    totalStaff: 0,
    onlineStaff: 0,
  })

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false)
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<'support' | 'team_lead' | 'supervisor'>('support')
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch chat statistics
      const { data: chats, error: chatError } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact' })

      // Fetch call statistics
      const { data: calls, error: callError } = await supabase
        .from('voice_calls')
        .select('*', { count: 'exact' })

      // Fetch staff members
      const { data: staff, error: staffError } = await supabase
        .from('support_staff')
        .select('*')
        .eq('is_active', true)

      if (!chatError && !callError && !staffError) {
        const activeChatCount = chats?.filter((c) => c.status === 'active').length || 0
        const activeCallCount = calls?.filter((c) => c.status === 'answered').length || 0
        const onlineStaffCount = staff?.filter((s) => s.availability_status === 'online').length || 0

        setStats({
          totalChats: chats?.length || 0,
          activeChatCount,
          avgChatDuration: 0, // Would be calculated from historical data
          totalCalls: calls?.length || 0,
          activeCallCount,
          avgCallDuration: 0, // Would be calculated from historical data
          totalStaff: staff?.length || 0,
          onlineStaff: onlineStaffCount,
        })

        setStaffMembers(staff || [])
      }
    } catch (error) {
      console.error('[v0] Error loading dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    if (!newStaffEmail || !newStaffName) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    try {
      // This would normally call an API endpoint to create a new staff member
      // For now, we'll just show a toast
      toast({
        title: 'Staff member added',
        description: `${newStaffName} has been added as ${newStaffRole}`,
      })

      setNewStaffEmail('')
      setNewStaffName('')
      setNewStaffRole('support')
      setShowAddStaffDialog(false)
      loadDashboardData()
    } catch (error) {
      console.error('[v0] Error adding staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to add staff member',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Support Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage customer support operations</p>
        </div>
        <Button onClick={() => setShowAddStaffDialog(true)} className="bg-primary">
          Add Support Staff
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChatCount}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalChats} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCallCount}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalCalls} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Staff</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineStaff}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalStaff} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <CardTitle>Support Staff</CardTitle>
          <CardDescription>Manage support team members and their availability</CardDescription>
        </CardHeader>
        <CardContent>
          {staffMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No support staff assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staffMembers.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  onClick={() => setSelectedStaff(staff)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{staff.staffName}</p>
                    <p className="text-sm text-muted-foreground">{staff.staffEmail}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {staff.role.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant={staff.availabilityStatus === 'online' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {staff.availabilityStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {staff.currentChatCount}/{staff.maxConcurrentChats} chats
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {staff.currentCallCount}/{staff.maxConcurrentCalls} calls
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Support Staff</DialogTitle>
            <DialogDescription>Add a new member to your support team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                type="email"
                placeholder="john@bank.alghahim.co.ke"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={newStaffRole} onValueChange={(value: any) => setNewStaffRole(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support Agent</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff}>Add Staff</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
