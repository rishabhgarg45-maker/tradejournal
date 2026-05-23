'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Trade, TradeStats, EquityPoint, MonthlyPnL } from '@/types'
import { calculateStats, calculateEquityCurve, calculateMonthlyPnL } from '@/lib/calculations'
import { StatsCards } from '@/components/stats-cards'
import { EquityCurve } from '@/components/charts/equity-curve'
import { MonthlyPnLChart } from '@/components/charts/monthly-pnl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#22c55e', '#ef4444']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    const loadTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
      if (data) setTrades(data as Trade[])
      setLoading(false)
    }
    loadTrades()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const stats: TradeStats = calculateStats(trades)
  const equityData: EquityPoint[] = calculateEquityCurve(trades)
  const monthlyData: MonthlyPnL[] = calculateMonthlyPnL(trades)

  const closedTrades = trades.filter(t => t.status === 'CLOSED')
  const winLossData = [
    { name: 'Wins', value: stats.winning_trades },
    { name: 'Losses', value: stats.losing_trades },
  ]

  const symbolPerformance = closedTrades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { symbol: trade.symbol, pnl: 0, trades: 0, wins: 0 }
    }
    const pnl = ((trade.exit_price || 0) - trade.entry_price) * trade.quantity * (trade.direction === 'LONG' ? 1 : -1) - trade.fees
    acc[trade.symbol].pnl += pnl
    acc[trade.symbol].trades++
    if (pnl > 0) acc[trade.symbol].wins++
    return acc
  }, {} as Record<string, { symbol: string; pnl: number; trades: number; wins: number }>)

  const topSymbols = Object.values(symbolPerformance)
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={equityData} />
        <MonthlyPnLChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Win / Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {winLossData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Wins: {stats.winning_trades} ({stats.win_rate.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Losses: {stats.losing_trades} ({(100 - stats.win_rate).toFixed(1)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Symbol Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSymbols} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {topSymbols.map((entry, index) => (
                      <Cell key={index} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Gross Profit</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(stats.gross_profit)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Loss</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(stats.gross_loss)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consecutive Wins</p>
              <p className="text-lg font-bold">{stats.max_consecutive_wins}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consecutive Losses</p>
              <p className="text-lg font-bold">{stats.max_consecutive_losses}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Holding Period</p>
              <p className="text-lg font-bold">{stats.avg_holding_period.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Win</p>
              <p className="text-lg font-bold text-green-500">{formatCurrency(stats.avg_win)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Loss</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(stats.avg_loss)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. R:R</p>
              <p className="text-lg font-bold">1:{stats.avg_rr.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
