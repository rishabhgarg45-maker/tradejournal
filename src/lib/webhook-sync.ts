export interface WebhookTrade {
  symbol: string
  direction: 'LONG' | 'SHORT'
  entry_price: number
  exit_price?: number
  quantity: number
  entry_date: string
  exit_date?: string
  stop_loss?: number
  take_profit?: number
  fees?: number
  strategy?: string
  trade_type?: 'DAY' | 'SWING' | 'SCALP'
  broker: 'tradovate' | 'exness' | 'mt4' | 'mt5' | 'other'
  broker_trade_id?: string
}

export function validateWebhookTrade(data: any): { valid: boolean; error?: string; trade?: WebhookTrade } {
  if (!data) return { valid: false, error: 'No data received' }
  if (!data.symbol) return { valid: false, error: 'symbol is required' }
  if (!data.direction || !['LONG', 'SHORT'].includes(data.direction)) {
    return { valid: false, error: 'direction must be LONG or SHORT' }
  }
  if (!data.entry_price || isNaN(Number(data.entry_price))) {
    return { valid: false, error: 'entry_price must be a number' }
  }
  if (!data.quantity || isNaN(Number(data.quantity))) {
    return { valid: false, error: 'quantity must be a number' }
  }

  return {
    valid: true,
    trade: {
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      entry_price: Number(data.entry_price),
      exit_price: data.exit_price ? Number(data.exit_price) : undefined,
      quantity: Number(data.quantity),
      entry_date: data.entry_date || new Date().toISOString(),
      exit_date: data.exit_date || undefined,
      stop_loss: data.stop_loss ? Number(data.stop_loss) : undefined,
      take_profit: data.take_profit ? Number(data.take_profit) : undefined,
      fees: data.fees ? Number(data.fees) : 0,
      strategy: data.strategy || undefined,
      trade_type: data.trade_type || 'DAY',
      broker: data.broker || 'other',
      broker_trade_id: data.broker_trade_id || undefined,
    },
  }
}
