"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Settings, Shield, Bell, Database, Lock, AlertTriangle, Save, RefreshCw } from "lucide-react"

interface SystemSettings {
  maintenance_mode: boolean
  maintenance_message: string
  max_login_attempts: number
  session_timeout: number
  email_notifications: boolean
  sms_notifications: boolean
  kyc_auto_approval: boolean
  transaction_limits: {
    daily_limit: number
    monthly_limit: number
    single_transaction_limit: number
  }
  interest_rates: {
    savings_rate: number
    loan_rate: number
  }
  fees: {
    transfer_fee: number
    withdrawal_fee: number
    maintenance_fee: number
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    maintenance_message: "System is under maintenance. Please try again later.",
    max_login_attempts: 5,
    session_timeout: 30,
    email_notifications: true,
    sms_notifications: false,
    kyc_auto_approval: false,
    transaction_limits: {
      daily_limit: 50000,
      monthly_limit: 500000,
      single_transaction_limit: 100000,
    },
    interest_rates: {
      savings_rate: 2.5,
      loan_rate: 8.5,
    },
    fees: {
      transfer_fee: 25,
      withdrawal_fee: 10,
      maintenance_fee: 100,
    },
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("system_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSettings(data.settings)
        setLastUpdated(new Date(data.updated_at).toLocaleString())
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.from("system_settings").upsert({
        id: 1,
        settings: settings,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setLastUpdated(new Date().toLocaleString())
      toast({
        title: "Success",
        description: "System settings updated successfully",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev }
      const keys = path.split(".")
      let current: any = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and parameters</p>
          {lastUpdated && <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>}
        </div>
        <Button onClick={saveSettings} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="rates">Rates & Fees</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting("session_timeout", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting("max_login_attempts", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>KYC Auto Approval</Label>
                  <p className="text-sm text-gray-500">Automatically approve KYC submissions</p>
                </div>
                <Switch
                  checked={settings.kyc_auto_approval}
                  onCheckedChange={(checked) => updateSetting("kyc_auto_approval", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>Changes to security settings will affect all users immediately.</AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="max-attempts">Maximum Login Attempts</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.max_login_attempts}
                  onChange={(e) => updateSetting("max_login_attempts", Number.parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500">Number of failed login attempts before account lockout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout-security">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout-security"
                  type="number"
                  min="5"
                  max="120"
                  value={settings.session_timeout}
                  onChange={(e) => updateSetting("session_timeout", Number.parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-500">Automatic logout after inactivity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send email notifications to users</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send SMS notifications to users</p>
                </div>
                <Switch
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Transaction Limits
              </CardTitle>
              <CardDescription>Set transaction limits for users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-limit">Daily Limit (₦)</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    value={settings.transaction_limits.daily_limit}
                    onChange={(e) => updateSetting("transaction_limits.daily_limit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-limit">Monthly Limit (₦)</Label>
                  <Input
                    id="monthly-limit"
                    type="number"
                    value={settings.transaction_limits.monthly_limit}
                    onChange={(e) => updateSetting("transaction_limits.monthly_limit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single-limit">Single Transaction Limit (₦)</Label>
                  <Input
                    id="single-limit"
                    type="number"
                    value={settings.transaction_limits.single_transaction_limit}
                    onChange={(e) =>
                      updateSetting("transaction_limits.single_transaction_limit", Number.parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Interest Rates</CardTitle>
                <CardDescription>Configure interest rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="savings-rate">Savings Rate (%)</Label>
                  <Input
                    id="savings-rate"
                    type="number"
                    step="0.1"
                    value={settings.interest_rates.savings_rate}
                    onChange={(e) => updateSetting("interest_rates.savings_rate", Number.parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-rate">Loan Rate (%)</Label>
                  <Input
                    id="loan-rate"
                    type="number"
                    step="0.1"
                    value={settings.interest_rates.loan_rate}
                    onChange={(e) => updateSetting("interest_rates.loan_rate", Number.parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Fees</CardTitle>
                <CardDescription>Configure transaction fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-fee">Transfer Fee (₦)</Label>
                  <Input
                    id="transfer-fee"
                    type="number"
                    value={settings.fees.transfer_fee}
                    onChange={(e) => updateSetting("fees.transfer_fee", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-fee">Withdrawal Fee (₦)</Label>
                  <Input
                    id="withdrawal-fee"
                    type="number"
                    value={settings.fees.withdrawal_fee}
                    onChange={(e) => updateSetting("fees.withdrawal_fee", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-fee">Monthly Maintenance Fee (₦)</Label>
                  <Input
                    id="maintenance-fee"
                    type="number"
                    value={settings.fees.maintenance_fee}
                    onChange={(e) => updateSetting("fees.maintenance_fee", Number.parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>Control system maintenance mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={settings.maintenance_mode ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{settings.maintenance_mode ? "Maintenance Mode Active" : "System Operational"}</AlertTitle>
                <AlertDescription>
                  {settings.maintenance_mode
                    ? "The system is currently in maintenance mode. Users cannot access the application."
                    : "The system is operational and users can access all features."}
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Prevent users from accessing the system</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  placeholder="Enter message to display to users during maintenance"
                  value={settings.maintenance_message}
                  onChange={(e) => updateSetting("maintenance_message", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
