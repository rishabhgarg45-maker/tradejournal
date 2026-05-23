'use client'

import { Trade } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { calculatePnL } from '@/lib/calculations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit3,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

interface TradeTableProps {
  trades: Trade[]
  onDelete: (id: string) => void
}

export function TradeTable({ trades, onDelete }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trades yet. Start by logging your first trade!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Symbol</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Direction</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Entry</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Exit</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">P&L</th>
            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Type</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const pnl = trade.status === 'CLOSED' && trade.exit_price
              ? calculatePnL(trade)
              : null
            const isProfit = pnl !== null && pnl >= 0

            return (
              <tr key={trade.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                <td className="py-3 px-4 text-muted-foreground">
                  {formatDate(trade.entry_date)}
                </td>
                <td className="py-3 px-4 font-medium">{trade.symbol}</td>
                <td className="py-3 px-4">
                  <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'}>
                    {trade.direction === 'LONG' ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    {trade.direction}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right font-mono">{trade.entry_price.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-mono">
                  {trade.exit_price?.toFixed(2) || '-'}
                </td>
                <td className="py-3 px-4 text-right font-mono">{trade.quantity}</td>
                <td className={`py-3 px-4 text-right font-mono ${pnl !== null ? (isProfit ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                  {pnl !== null ? formatCurrency(pnl) : 'OPEN'}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="outline">{trade.trade_type}</Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/trades/${trade.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => onDelete(trade.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Link href={`/trade-replay?tradeId=${trade.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
