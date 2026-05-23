'use client'

import { TradeStats } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  BarChart3,
  Zap,
  Shield,
} from 'lucide-react'

interface StatsCardsProps {
  stats: TradeStats
}

const statItems = (stats: TradeStats) => [
  {
    label: 'Total P&L',
    value: formatCurrency(stats.total_pnl),
    icon: DollarSign,
    color: stats.total_pnl >= 0 ? 'text-green-500' : 'text-red-500',
    bg: stats.total_pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
  },
  {
    label: 'Win Rate',
    value: `${stats.win_rate.toFixed(1)}%`,
    icon: Target,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    label: 'Total Trades',
    value: stats.total_trades.toString(),
    icon: Activity,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    label: 'Avg. Risk:Reward',
    value: `1:${stats.avg_rr.toFixed(2)}`,
    icon: BarChart3,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    label: 'Profit Factor',
    value: stats.profit_factor === Infinity ? '∞' : stats.profit_factor.toFixed(2),
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    label: 'Avg Win',
    value: formatCurrency(stats.avg_win),
    icon: TrendingUp,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    label: 'Avg Loss',
    value: formatCurrency(stats.avg_loss),
    icon: TrendingDown,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    label: 'Expectancy',
    value: formatCurrency(stats.expectancy),
    icon: Zap,
    color: stats.expectancy >= 0 ? 'text-green-500' : 'text-red-500',
    bg: stats.expectancy >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
  },
  {
    label: 'Max Drawdown',
    value: formatPercent(-stats.max_drawdown),
    icon: Shield,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    label: 'Sharpe Ratio',
    value: stats.sharpe_ratio.toFixed(2),
    icon: Activity,
    color: stats.sharpe_ratio >= 1 ? 'text-green-500' : stats.sharpe_ratio >= 0 ? 'text-yellow-500' : 'text-red-500',
    bg: 'bg-cyan-500/10',
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  if (stats.total_trades === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <p>No data yet. Log some trades to see your stats.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {statItems(stats).map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <div className={`p-1.5 rounded-md ${item.bg}`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
