'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileDownload, Mail, Eye, Loader2, AlertCircle } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  account_no: string
  created_at: string
}

export default function AgreementsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter((user) => {
      const query = searchQuery.toLowerCase()
      return (
        user.email.toLowerCase().includes(query) ||
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.account_no.toLowerCase().includes(query)
      )
    })
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, account_no, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendAgreement = async (user: User) => {
    try {
      setResendingId(user.id)
      setError('')
      setSuccess('')

      const response = await fetch('/api/agreements/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          accountNumber: user.account_no,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send agreement')
      }

      setSuccess(`Agreement resent to ${user.email}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError((err as Error).message || 'Failed to resend agreement')
    } finally {
      setResendingId(null)
    }
  }

  const handleDownloadAgreement = async (user: User) => {
    try {
      setDownloadingId(user.id)
      setError('')

      const response = await fetch(`/api/agreements/download?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to download agreement')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AV-Bank-Account-Agreement-${user.account_no}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError((err as Error).message || 'Failed to download agreement')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleViewAgreement = async (user: User) => {
    try {
      const response = await fetch(`/api/agreements/download?userId=${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agreement')
      }

      const html = await response.text()
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(html)
        newWindow.document.close()
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to view agreement')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Legal Agreements</h1>
        <p className="text-muted-foreground mt-2">Manage and track customer account agreements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Agreements Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{users.length}</div>
            <p className="text-sm text-muted-foreground mt-2">Active Agreements</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find customers by name, email, or account number</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name, email, or account number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers & Agreements</CardTitle>
          <CardDescription>View, download, and resend account agreements</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Name</p>
                      <p className="font-semibold">{user.first_name} {user.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Email</p>
                      <p className="text-sm">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Account</p>
                      <p className="font-mono text-sm">{user.account_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Created</p>
                      <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewAgreement(user)}
                      disabled={downloadingId === user.id || resendingId === user.id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadAgreement(user)}
                      disabled={downloadingId === user.id || resendingId === user.id}
                    >
                      {downloadingId === user.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDownload className="h-4 w-4 mr-2" />
                      )}
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendAgreement(user)}
                      disabled={resendingId === user.id || downloadingId === user.id}
                    >
                      {resendingId === user.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-blue-900 mb-2">About Agreement Management</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Agreements are automatically sent to customers upon email verification</li>
                <li>• Use "Resend" to send a fresh copy of the agreement to any customer</li>
                <li>• Use "Download" to get a copy of the agreement for your records</li>
                <li>• Use "View" to preview the agreement in a new browser window</li>
                <li>• Agreements include company letterhead, legal terms, and signature blocks</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
