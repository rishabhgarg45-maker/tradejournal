'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
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
  Copy,
} from 'lucide-react'

interface SyncResult {
  success: boolean
  message: string
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()

  const [alpacaKey, setAlpacaKey] = useState('')
  const [alpacaSecret, setAlpacaSecret] = useState('')
  const [alpacaSyncing, setAlpacaSyncing] = useState(false)
  const [alpacaResult, setAlpacaResult] = useState<SyncResult | null>(null)

  const [tvUsername, setTvUsername] = useState('')
  const [tvPassword, setTvPassword] = useState('')
  const [tvAppId, setTvAppId] = useState('TradeJournal')
  const [tvAppSecret, setTvAppSecret] = useState('')
  const [tvUseDemo, setTvUseDemo] = useState(true)
  const [tvSyncing, setTvSyncing] = useState(false)
  const [tvResult, setTvResult] = useState<SyncResult | null>(null)

  const [webhookCopied, setWebhookCopied] = useState(false)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sync/webhook`
    : ''

  const handleSyncAlpaca = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlpacaSyncing(true)
    setAlpacaResult(null)

    const res = await fetch('/api/alpaca/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: alpacaKey, apiSecret: alpacaSecret }),
    })
    const data = await res.json()

    setAlpacaResult({
      success: data.success,
      message: data.success
        ? `Connected! Imported ${data.trades_imported} trades.`
        : data.error || 'Failed to connect Alpaca',
    })
    setAlpacaSyncing(false)
  }

  const handleSyncTradovate = async (e: React.FormEvent) => {
    e.preventDefault()
    setTvSyncing(true)
    setTvResult(null)

    const body: any = {
      username: tvUsername,
      password: tvPassword,
      useDemo: tvUseDemo,
    }
    if (tvAppId) body.appId = tvAppId
    if (tvAppSecret) body.appSecret = tvAppSecret

    const res = await fetch('/api/sync/tradovate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()

    setTvResult({
      success: data.success,
      message: data.success
        ? `Connected! Imported ${data.trades_imported} trades.`
        : data.error || 'Failed to connect Tradovate',
    })
    setTvSyncing(false)
  }

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setWebhookCopied(true)
    setTimeout(() => setWebhookCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>

      {/* Profile */}
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
          <Button variant="destructive" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Alpaca */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Brokerage Connections</CardTitle>
          </div>
          <CardDescription>Connect your broker to auto-import trades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alpaca */}
          <form onSubmit={handleSyncAlpaca} className="space-y-4 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                <span className="text-blue-500 text-xs font-bold">A</span>
              </div>
              <span className="font-medium">Alpaca (Paper Trading)</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alpacaKey">API Key</Label>
              <Input id="alpacaKey" type="password" placeholder="Enter your Alpaca API key" value={alpacaKey} onChange={(e) => setAlpacaKey(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alpacaSecret">Secret Key</Label>
              <Input id="alpacaSecret" type="password" placeholder="Enter your Alpaca secret key" value={alpacaSecret} onChange={(e) => setAlpacaSecret(e.target.value)} />
            </div>
            {alpacaResult && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${alpacaResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {alpacaResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {alpacaResult.message}
              </div>
            )}
            <Button type="submit" disabled={alpacaSyncing || !alpacaKey || !alpacaSecret}>
              {alpacaSyncing ? 'Connecting...' : 'Connect & Sync'}
            </Button>
          </form>

          {/* Tradovate */}
          <form onSubmit={handleSyncTradovate} className="space-y-4 pb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                <span className="text-green-500 text-xs font-bold">T</span>
              </div>
              <span className="font-medium">Tradovate</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your Tradovate login credentials (same ones you use with your Lucid account). 
              No API registration needed — <span className="text-foreground">App ID</span> is just a label for this app.
            </p>
            <div className="space-y-2">
              <Label htmlFor="tvUsername">Tradovate Username</Label>
              <Input id="tvUsername" placeholder="Your Tradovate username" value={tvUsername} onChange={(e) => setTvUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tvPassword">Tradovate Password</Label>
              <Input id="tvPassword" type="password" placeholder="Your Tradovate password" value={tvPassword} onChange={(e) => setTvPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tvAppId">App ID <span className="text-muted-foreground font-normal">(optional label, defaults to TradeJournal)</span></Label>
              <Input id="tvAppId" placeholder="TradeJournal" value={tvAppId} onChange={(e) => setTvAppId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tvAppSecret">App Secret <span className="text-muted-foreground font-normal">(only if your Tradovate account requires it)</span></Label>
              <Input id="tvAppSecret" type="password" placeholder="Leave blank" value={tvAppSecret} onChange={(e) => setTvAppSecret(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tvUseDemo} onChange={(e) => setTvUseDemo(e.target.checked)} className="rounded border-border" />
              Use Demo account
            </label>
            {tvResult && (
              <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${tvResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {tvResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                {tvResult.message}
              </div>
            )}
            <Button type="submit" disabled={tvSyncing || !tvUsername || !tvPassword}>
              {tvSyncing ? 'Connecting...' : 'Connect & Sync Trades'}
            </Button>
          </form>

          {/* Exness / MT4/MT5 Webhook */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-orange-500/10 flex items-center justify-center shrink-0">
                <span className="text-orange-500 text-xs font-bold">E</span>
              </div>
              <span className="font-medium">Exness / MT4 / MT5</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this webhook URL in your MT4/MT5 Expert Advisor to auto-log trades. 
              The EA should POST trade data as JSON when a trade is opened or closed.
            </p>
            <div className="flex items-center gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={copyWebhook}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {webhookCopied && <p className="text-xs text-green-500">Copied!</p>}

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-medium mb-2">Expected JSON format:</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify({
                symbol: 'EURUSD',
                direction: 'LONG',
                entry_price: 1.1050,
                exit_price: 1.1100,
                quantity: 0.1,
                entry_date: new Date().toISOString(),
                broker: 'exness',
              }, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Auth Token Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Preferences</CardTitle>
          </div>
          <CardDescription>
            For Exness/MT4/MT5, configure your EA to send trades to the webhook URL above. 
            Each request must include a valid session token from your logged-in browser, or use the API token from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The webhook endpoint is authenticated — you must be logged into TradeJournal in the browser 
            for it to accept trades. For automated EA use, contact support about dedicated API tokens.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
