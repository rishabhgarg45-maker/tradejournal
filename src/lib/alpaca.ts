import { Trade } from "@/types"

const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'

export async function syncAlpacaTrades(apiKey: string, apiSecret: string): Promise<Partial<Trade>[]> {
  const response = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Alpaca positions')
  }

  const positions = await response.json()
  return positions.map((pos: any) => ({
    symbol: pos.symbol,
    direction: pos.side.toUpperCase() as 'LONG' | 'SHORT',
    entry_price: parseFloat(pos.avg_entry_price),
    quantity: Math.abs(parseInt(pos.qty)),
    current_price: parseFloat(pos.current_price),
    unrealized_pl: parseFloat(pos.unrealized_pl),
    trade_type: 'DAY',
  }))
}

export async function getAlpacaAccount(apiKey: string, apiSecret: string) {
  const response = await fetch(`${ALPACA_BASE_URL}/v2/account`, {
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Alpaca account')
  }

  return response.json()
}

export async function getAlpacaHistory(apiKey: string, apiSecret: string, days: number = 30) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const response = await fetch(
    `${ALPACA_BASE_URL}/v2/account/activities?activity_type=FILL&after=${start.toISOString()}&until=${end.toISOString()}`,
    {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Alpaca history')
  }

  return response.json()
}
