interface TradovateCredentials {
  accessToken: string
  userId: number
  expirationTime: number
}

interface TradovateFill {
  id: number
  orderId: number
  contractId: number
  timestamp: string
  tradeDate: string
  action: 'Buy' | 'Sell'
  qty: number
  price: number
  activeBuyQty: number
  activeSellQty: number
}

const BASE_URL = 'https://live.tradovateapi.com/v1'
const DEMO_URL = 'https://demo.tradovateapi.com/v1'

let authCache: { credentials: TradovateCredentials; expiry: number } | null = null

export async function authenticate(
  name: string,
  password: string,
  appId: string = 'TradeJournal',
  appVersion: string = '1.0',
  useDemo: boolean = false,
  appSecret?: string
): Promise<TradovateCredentials> {
  const base = useDemo ? DEMO_URL : BASE_URL

  const body: any = { name, password, appId, appVersion, cid: 'TradeJournal' }
  if (appSecret) body.sec = appSecret

  const res = await fetch(`${base}/auth/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()

  if (!res.ok) {
    let msg = text
    try {
      const j = JSON.parse(text)
      msg = j.error || j.message || text
    } catch {}
    throw new Error(msg)
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid response from Tradovate')
  }

  if (!data.accessToken) {
    throw new Error(data.error || data.message || 'No access token received')
  }

  const credentials: TradovateCredentials = {
    accessToken: data.accessToken,
    userId: data.userId,
    expirationTime: Date.now() + data.expirationTime * 1000,
  }

  authCache = { credentials, expiry: Date.now() + 30 * 60 * 1000 }
  return credentials
}

async function getAccessToken(name: string, password: string, appId?: string, useDemo?: boolean): Promise<string> {
  if (authCache && authCache.expiry > Date.now()) {
    return authCache.credentials.accessToken
  }
  const creds = await authenticate(name, password, appId, '1.0', useDemo)
  return creds.accessToken
}

export async function getAccounts(
  name: string,
  password: string,
  appId?: string,
  useDemo?: boolean
): Promise<any[]> {
  const token = await getAccessToken(name, password, appId, useDemo)
  const base = useDemo ? DEMO_URL : BASE_URL

  const res = await fetch(`${base}/account/list`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Failed to fetch Tradovate accounts')
  return res.json()
}

export async function getFills(
  name: string,
  password: string,
  startDate: string,
  endDate: string,
  appId?: string,
  useDemo?: boolean
): Promise<TradovateFill[]> {
  const token = await getAccessToken(name, password, appId, useDemo)
  const base = useDemo ? DEMO_URL : BASE_URL

  const res = await fetch(`${base}/fill/list`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      masterids: [],
    }),
  })

  if (!res.ok) throw new Error('Failed to fetch Tradovate fills')
  const data = await res.json()
  return data.map((item: any) => item.fill || item)
}

export async function getContractSpec(
  contractId: number,
  token: string,
  useDemo?: boolean
): Promise<any> {
  const base = useDemo ? DEMO_URL : BASE_URL
  const res = await fetch(`${base}/contract/${contractId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export function mapTradovateToTrade(fill: TradovateFill): {
  symbol: string
  direction: 'LONG' | 'SHORT'
  entry_price: number
  quantity: number
  entry_date: string
} {
  return {
    symbol: `${fill.contractId}`,
    direction: fill.action === 'Buy' ? 'LONG' : 'SHORT',
    entry_price: fill.price,
    quantity: fill.qty,
    entry_date: new Date(fill.timestamp).toISOString(),
  }
}
