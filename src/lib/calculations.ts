import { Trade, TradeStats, EquityPoint, MonthlyPnL } from "@/types"
import { getMultiplier } from "./cme-futures"

function getContractMultiplier(trade: Trade): number {
  return trade.contract_multiplier ?? getMultiplier(trade.symbol)
}

export function calculatePnL(trade: Trade): number {
  if (!trade.exit_price) return 0
  const dir = trade.direction === 'LONG' ? 1 : -1
  const cm = getContractMultiplier(trade)
  return (trade.exit_price - trade.entry_price) * cm * trade.quantity * dir - trade.fees
}

export function calculateRR(trade: Trade): number {
  if (!trade.exit_price || !trade.stop_loss) return 0
  const cm = getContractMultiplier(trade)
  const risk = Math.abs(trade.entry_price - trade.stop_loss) * cm * trade.quantity
  if (risk === 0) return 0
  const reward = Math.abs(trade.exit_price - trade.entry_price) * cm * trade.quantity
  return reward / risk
}

export function calculateStats(trades: Trade[]): TradeStats {
  const closedTrades = trades.filter(t => t.status === 'CLOSED')
  const total = closedTrades.length

  if (total === 0) {
    return {
      total_trades: 0, winning_trades: 0, losing_trades: 0, win_rate: 0,
      total_pnl: 0, avg_win: 0, avg_loss: 0, avg_rr: 0, profit_factor: 0,
      max_drawdown: 0, max_consecutive_wins: 0, max_consecutive_losses: 0,
      avg_holding_period: 0, gross_profit: 0, gross_loss: 0, expectancy: 0,
      sharpe_ratio: 0,
    }
  }

  const pnls = closedTrades.map(calculatePnL)
  const winning = pnls.filter(p => p > 0)
  const losing = pnls.filter(p => p <= 0)
  const wins = winning.length
  const losses = losing.length

  const totalPnl = pnls.reduce((a, b) => a + b, 0)
  const grossProfit = winning.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(losing.reduce((a, b) => a + b, 0))

  const avgWin = wins > 0 ? grossProfit / wins : 0
  const avgLoss = losses > 0 ? grossLoss / losses : 0

  const rrs = closedTrades.map(calculateRR).filter(r => r > 0)
  const avgRr = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0

  let consecutiveWins = 0, consecutiveLosses = 0
  let maxCW = 0, maxCL = 0
  for (const pnl of pnls) {
    if (pnl > 0) {
      consecutiveWins++
      consecutiveLosses = 0
      maxCW = Math.max(maxCW, consecutiveWins)
    } else {
      consecutiveLosses++
      consecutiveWins = 0
      maxCL = Math.max(maxCL, consecutiveLosses)
    }
  }

  let peak = 0, maxDd = 0, running = 0
  for (const pnl of pnls) {
    running += pnl
    if (running > peak) peak = running
    const dd = (peak - running) / (peak || 1) * 100
    maxDd = Math.max(maxDd, dd)
  }

  const holdingPeriods = closedTrades.map(t => {
    const entry = new Date(t.entry_date).getTime()
    const exit = new Date(t.exit_date!).getTime()
    return (exit - entry) / (1000 * 60 * 60)
  })
  const avgHolding = holdingPeriods.length > 0
    ? holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length
    : 0

  const expectancy = total > 0 ? totalPnl / total : 0

  const mean = pnls.reduce((a, b) => a + b, 0) / total
  const variance = pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / total
  const stdDev = Math.sqrt(variance)
  const sharpe = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0

  return {
    total_trades: total,
    winning_trades: wins,
    losing_trades: losses,
    win_rate: total > 0 ? (wins / total) * 100 : 0,
    total_pnl: totalPnl,
    avg_win: avgWin,
    avg_loss: avgLoss,
    avg_rr: avgRr,
    profit_factor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    max_drawdown: maxDd,
    max_consecutive_wins: maxCW,
    max_consecutive_losses: maxCL,
    avg_holding_period: avgHolding,
    gross_profit: grossProfit,
    gross_loss: grossLoss,
    expectancy,
    sharpe_ratio: sharpe,
  }
}

export function calculateEquityCurve(trades: Trade[]): EquityPoint[] {
  const closed = trades
    .filter(t => t.status === 'CLOSED' && t.exit_date)
    .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime())

  let runningEquity = 0
  let peak = 0
  const points: EquityPoint[] = []

  for (const trade of closed) {
    const pnl = calculatePnL(trade)
    runningEquity += pnl
    if (runningEquity > peak) peak = runningEquity
    const dd = peak > 0 ? ((peak - runningEquity) / peak) * 100 : 0
    points.push({
      date: trade.exit_date!.split('T')[0],
      equity: runningEquity,
      drawdown: dd,
    })
  }

  if (points.length === 0) {
    points.push({ date: new Date().toISOString().split('T')[0], equity: 0, drawdown: 0 })
  }

  return points
}

export function calculateMonthlyPnL(trades: Trade[]): MonthlyPnL[] {
  const closed = trades.filter(t => t.status === 'CLOSED' && t.exit_date)
  const monthly: Record<string, { pnl: number; trades: number }> = {}

  for (const trade of closed) {
    const month = trade.exit_date!.substring(0, 7)
    if (!monthly[month]) monthly[month] = { pnl: 0, trades: 0 }
    monthly[month].pnl += calculatePnL(trade)
    monthly[month].trades++
  }

  return Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }))
}
