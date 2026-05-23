'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  User,
  Bell,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [alpacaKey, setAlpacaKey] = useState('')
  const [alpacaSecret, setAlpacaSecret] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSyncAlpaca = async (e: React.FormEvent) => {
    e.preventDefault()
    setSyncing(true)
    setSyncResult(null)

    const res = await fetch('/api/alpaca/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: alpacaKey, apiSecret: alpacaSecret }),
    })

    const data = await res.json()

    if (data.success) {
      setSyncResult({
        success: true,
        message: `Connected! Imported ${data.trades_imported} trades.`,
      })
    } else {
      setSyncResult({
        success: false,
        message: data.error || 'Failed to connect Alpaca',
      })
    }

    setSyncing(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Profile</CardTitle>
          </div>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium mt-1">{user?.email}</p>
          </div>
          <div>
            <Label>User ID</Label>
            <p className="text-sm font-mono text-muted-foreground mt-1">{user?.id}</p>
          </div>
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Brokerage Connections</CardTitle>
          </div>
          <CardDescription>Connect your brokerage to auto-import trades</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSyncAlpaca} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                <span className="text-blue-500 text-xs font-bold">A</span>
              </div>
              <span className="font-medium">Alpaca (Paper Trading)</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alpacaKey">API Key</Label>
              <Input
                id="alpacaKey"
                type="password"
                placeholder="Enter your Alpaca API key"
                value={alpacaKey}
                onChange={(e) => setAlpacaKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alpacaSecret">Secret Key</Label>
              <Input
                id="alpacaSecret"
                type="password"
                placeholder="Enter your Alpaca secret key"
                value={alpacaSecret}
                onChange={(e) => setAlpacaSecret(e.target.value)}
              />
            </div>

            {syncResult && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
                syncResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {syncResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {syncResult.message}
              </div>
            )}

            <Button type="submit" disabled={syncing || !alpacaKey || !alpacaSecret}>
              {syncing ? 'Connecting...' : 'Connect & Sync Trades'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Preferences</CardTitle>
          </div>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More preferences coming soon, including default trade types, risk settings, and notification preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
