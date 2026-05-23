export type TradeDirection = 'LONG' | 'SHORT'
export type TradeType = 'DAY' | 'SWING' | 'SCALP'
export type TradeStatus = 'OPEN' | 'CLOSED'

export interface Trade {
  id: string
  user_id: string
  symbol: string
  direction: TradeDirection
  entry_price: number
  exit_price: number | null
  quantity: number
  entry_date: string
  exit_date: string | null
  stop_loss: number | null
  take_profit: number | null
  fees: number
  strategy: string | null
  setup: string | null
  tags: string[]
  notes: string | null
  screenshot_url: string | null
  trade_type: TradeType
  status: TradeStatus
  created_at: string
  updated_at: string
}

export interface TradeFormData {
  symbol: string
  direction: TradeDirection
  entry_price: number
  exit_price?: number
  quantity: number
  entry_date: string
  exit_date?: string
  stop_loss?: number
  take_profit?: number
  fees?: number
  strategy?: string
  setup?: string
  tags?: string[]
  notes?: string
  trade_type: TradeType
}

export interface TradeStats {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  avg_win: number
  avg_loss: number
  avg_rr: number
  profit_factor: number
  max_drawdown: number
  max_consecutive_wins: number
  max_consecutive_losses: number
  avg_holding_period: number
  gross_profit: number
  gross_loss: number
  expectancy: number
  sharpe_ratio: number
}

export interface EquityPoint {
  date: string
  equity: number
  drawdown: number
}

export interface MonthlyPnL {
  month: string
  pnl: number
  trades: number
}

export interface BrokerageAccount {
  id: string
  user_id: string
  provider: string
  account_id: string
  account_name: string
  is_connected: boolean
  created_at: string
}

export interface TradeReplay {
  trade: Trade
  bars: CandleBar[]
}

export interface CandleBar {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
