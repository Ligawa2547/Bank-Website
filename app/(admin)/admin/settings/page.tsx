"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Settings, Shield, Bell, DollarSign, Wrench, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const dynamic = "force-dynamic"

interface SystemSettings {
  general: {
    session_timeout: number
    max_login_attempts: number
    kyc_auto_approval: boolean
    maintenance_mode: boolean
    maintenance_message: string
  }
  security: {
    password_min_length: number
    require_2fa: boolean
    session_timeout_warning: number
    auto_logout_inactive: boolean
    ip_whitelist_enabled: boolean
    ip_whitelist: string[]
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    transaction_alerts: boolean
    login_alerts: boolean
    kyc_alerts: boolean
  }
  limits: {
    daily_transfer_limit: number
    monthly_transfer_limit: number
    single_transaction_limit: number
    daily_withdrawal_limit: number
    monthly_withdrawal_limit: number
  }
  rates_fees: {
    savings_interest_rate: number
    loan_interest_rate: number
    transfer_fee: number
    withdrawal_fee: number
    monthly_maintenance_fee: number
    overdraft_fee: number
  }
  maintenance: {
    scheduled_maintenance: boolean
    maintenance_start: string | null
    maintenance_end: string | null
    maintenance_message: string
    allow_admin_access: boolean
  }
}

const defaultSettings: SystemSettings = {
  general: {
    session_timeout: 30,
    max_login_attempts: 5,
    kyc_auto_approval: false,
    maintenance_mode: false,
    maintenance_message: "System is under maintenance. Please try again later.",
  },
  security: {
    password_min_length: 8,
    require_2fa: false,
    session_timeout_warning: 5,
    auto_logout_inactive: true,
    ip_whitelist_enabled: false,
    ip_whitelist: [],
  },
  notifications: {
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    transaction_alerts: true,
    login_alerts: true,
    kyc_alerts: true,
  },
  limits: {
    daily_transfer_limit: 1000000,
    monthly_transfer_limit: 10000000,
    single_transaction_limit: 500000,
    daily_withdrawal_limit: 200000,
    monthly_withdrawal_limit: 2000000,
  },
  rates_fees: {
    savings_interest_rate: 2.5,
    loan_interest_rate: 15.0,
    transfer_fee: 50,
    withdrawal_fee: 25,
    monthly_maintenance_fee: 100,
    overdraft_fee: 500,
  },
  maintenance: {
    scheduled_maintenance: false,
    maintenance_start: null,
    maintenance_end: null,
    maintenance_message: "Scheduled maintenance in progress.",
    allow_admin_access: true,
  },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("general")
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      setIsLoading(true)
      setError("")

      // Check if user is admin
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Authentication required")
        return
      }

      const { data: adminData } = await supabase.from("admins").select("role").eq("user_id", user.id).single()

      if (!adminData) {
        setError("Admin access required")
        return
      }

      // Fetch system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("category, settings")

      if (settingsError) {
        console.error("Settings fetch error:", settingsError)
        setError("Failed to load settings. Using defaults.")
        return
      }

      if (settingsData && settingsData.length > 0) {
        const loadedSettings = { ...defaultSettings }
        settingsData.forEach((item) => {
          if (item.category in loadedSettings) {
            loadedSettings[item.category as keyof SystemSettings] = {
              ...loadedSettings[item.category as keyof SystemSettings],
              ...item.settings,
            }
          }
        })
        setSettings(loadedSettings)
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Failed to load settings. Using defaults.")
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (category: keyof SystemSettings) => {
    try {
      const supabase = createClient()
      setIsSaving(true)
      setError("")

      const { error } = await supabase.from("system_settings").upsert({
        category,
        settings: settings[category],
      })

      if (error) {
        throw error
      }

      toast({
        title: "Settings saved",
        description: `${category} settings have been updated successfully.`,
      })
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("Failed to save settings. Please try again.")
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and parameters</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="rates_fees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Rates & Fees
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system parameters and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.general.session_timeout}
                    onChange={(e) => updateSetting("general", "session_timeout", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.general.max_login_attempts}
                    onChange={(e) => updateSetting("general", "max_login_attempts", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>KYC Auto-Approval</Label>
                  <p className="text-sm text-muted-foreground">Automatically approve KYC submissions</p>
                </div>
                <Switch
                  checked={settings.general.kyc_auto_approval}
                  onCheckedChange={(checked) => updateSetting("general", "kyc_auto_approval", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable system-wide maintenance mode</p>
                </div>
                <Switch
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting("general", "maintenance_mode", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Input
                  id="maintenance_message"
                  value={settings.general.maintenance_message}
                  onChange={(e) => updateSetting("general", "maintenance_message", e.target.value)}
                />
              </div>

              <Button onClick={() => saveSettings("general")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save General Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security policies and authentication requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting("security", "password_min_length", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout_warning">Session Timeout Warning (minutes)</Label>
                  <Input
                    id="session_timeout_warning"
                    type="number"
                    value={settings.security.session_timeout_warning}
                    onChange={(e) =>
                      updateSetting("security", "session_timeout_warning", Number.parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require 2FA</Label>
                  <p className="text-sm text-muted-foreground">Require two-factor authentication for all users</p>
                </div>
                <Switch
                  checked={settings.security.require_2fa}
                  onCheckedChange={(checked) => updateSetting("security", "require_2fa", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Logout Inactive Users</Label>
                  <p className="text-sm text-muted-foreground">Automatically logout inactive users</p>
                </div>
                <Switch
                  checked={settings.security.auto_logout_inactive}
                  onCheckedChange={(checked) => updateSetting("security", "auto_logout_inactive", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Whitelist Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable IP address whitelisting</p>
                </div>
                <Switch
                  checked={settings.security.ip_whitelist_enabled}
                  onCheckedChange={(checked) => updateSetting("security", "ip_whitelist_enabled", checked)}
                />
              </div>

              <Button onClick={() => saveSettings("security")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable email notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "email_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable SMS notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "sms_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) => updateSetting("notifications", "push_notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Transaction Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send alerts for transactions</p>
                  </div>
                  <Switch
                    checked={settings.notifications.transaction_alerts}
                    onCheckedChange={(checked) => updateSetting("notifications", "transaction_alerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send alerts for login attempts</p>
                  </div>
                  <Switch
                    checked={settings.notifications.login_alerts}
                    onCheckedChange={(checked) => updateSetting("notifications", "login_alerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>KYC Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send alerts for KYC submissions</p>
                  </div>
                  <Switch
                    checked={settings.notifications.kyc_alerts}
                    onCheckedChange={(checked) => updateSetting("notifications", "kyc_alerts", checked)}
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings("notifications")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Settings */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Limits</CardTitle>
              <CardDescription>Configure transaction and withdrawal limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_transfer_limit">Daily Transfer Limit (₦)</Label>
                  <Input
                    id="daily_transfer_limit"
                    type="number"
                    value={settings.limits.daily_transfer_limit}
                    onChange={(e) => updateSetting("limits", "daily_transfer_limit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_transfer_limit">Monthly Transfer Limit (₦)</Label>
                  <Input
                    id="monthly_transfer_limit"
                    type="number"
                    value={settings.limits.monthly_transfer_limit}
                    onChange={(e) => updateSetting("limits", "monthly_transfer_limit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="single_transaction_limit">Single Transaction Limit (₦)</Label>
                  <Input
                    id="single_transaction_limit"
                    type="number"
                    value={settings.limits.single_transaction_limit}
                    onChange={(e) =>
                      updateSetting("limits", "single_transaction_limit", Number.parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="daily_withdrawal_limit">Daily Withdrawal Limit (₦)</Label>
                  <Input
                    id="daily_withdrawal_limit"
                    type="number"
                    value={settings.limits.daily_withdrawal_limit}
                    onChange={(e) => updateSetting("limits", "daily_withdrawal_limit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_withdrawal_limit">Monthly Withdrawal Limit (₦)</Label>
                  <Input
                    id="monthly_withdrawal_limit"
                    type="number"
                    value={settings.limits.monthly_withdrawal_limit}
                    onChange={(e) =>
                      updateSetting("limits", "monthly_withdrawal_limit", Number.parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings("limits")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Limit Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rates & Fees Settings */}
        <TabsContent value="rates_fees">
          <Card>
            <CardHeader>
              <CardTitle>Rates & Fees</CardTitle>
              <CardDescription>Configure interest rates and transaction fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="savings_interest_rate">Savings Interest Rate (%)</Label>
                  <Input
                    id="savings_interest_rate"
                    type="number"
                    step="0.1"
                    value={settings.rates_fees.savings_interest_rate}
                    onChange={(e) =>
                      updateSetting("rates_fees", "savings_interest_rate", Number.parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan_interest_rate">Loan Interest Rate (%)</Label>
                  <Input
                    id="loan_interest_rate"
                    type="number"
                    step="0.1"
                    value={settings.rates_fees.loan_interest_rate}
                    onChange={(e) =>
                      updateSetting("rates_fees", "loan_interest_rate", Number.parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer_fee">Transfer Fee (₦)</Label>
                  <Input
                    id="transfer_fee"
                    type="number"
                    value={settings.rates_fees.transfer_fee}
                    onChange={(e) => updateSetting("rates_fees", "transfer_fee", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal_fee">Withdrawal Fee (₦)</Label>
                  <Input
                    id="withdrawal_fee"
                    type="number"
                    value={settings.rates_fees.withdrawal_fee}
                    onChange={(e) => updateSetting("rates_fees", "withdrawal_fee", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_maintenance_fee">Monthly Maintenance Fee (₦)</Label>
                  <Input
                    id="monthly_maintenance_fee"
                    type="number"
                    value={settings.rates_fees.monthly_maintenance_fee}
                    onChange={(e) =>
                      updateSetting("rates_fees", "monthly_maintenance_fee", Number.parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overdraft_fee">Overdraft Fee (₦)</Label>
                  <Input
                    id="overdraft_fee"
                    type="number"
                    value={settings.rates_fees.overdraft_fee}
                    onChange={(e) => updateSetting("rates_fees", "overdraft_fee", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button onClick={() => saveSettings("rates_fees")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Rates & Fees
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Settings */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Settings</CardTitle>
              <CardDescription>Configure scheduled maintenance and system downtime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Scheduled Maintenance</Label>
                  <p className="text-sm text-muted-foreground">Enable scheduled maintenance mode</p>
                </div>
                <Switch
                  checked={settings.maintenance.scheduled_maintenance}
                  onCheckedChange={(checked) => updateSetting("maintenance", "scheduled_maintenance", checked)}
                />
              </div>

              {settings.maintenance.scheduled_maintenance && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_start">Maintenance Start</Label>
                    <Input
                      id="maintenance_start"
                      type="datetime-local"
                      value={settings.maintenance.maintenance_start || ""}
                      onChange={(e) => updateSetting("maintenance", "maintenance_start", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_end">Maintenance End</Label>
                    <Input
                      id="maintenance_end"
                      type="datetime-local"
                      value={settings.maintenance.maintenance_end || ""}
                      onChange={(e) => updateSetting("maintenance", "maintenance_end", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maintenance_message_scheduled">Maintenance Message</Label>
                <Input
                  id="maintenance_message_scheduled"
                  value={settings.maintenance.maintenance_message}
                  onChange={(e) => updateSetting("maintenance", "maintenance_message", e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Admin Access</Label>
                  <p className="text-sm text-muted-foreground">Allow admin access during maintenance</p>
                </div>
                <Switch
                  checked={settings.maintenance.allow_admin_access}
                  onCheckedChange={(checked) => updateSetting("maintenance", "allow_admin_access", checked)}
                />
              </div>

              <Button onClick={() => saveSettings("maintenance")} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Maintenance Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
