'use client'

import { Trade } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
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
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Symbol</th>
              <th className="text-left py-3 px-3 font-medium text-muted-foreground">Dir</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Entry</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Exit</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Qty</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">P&L</th>
              <th className="text-center py-3 px-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right py-3 px-3 font-medium text-muted-foreground">Actions</th>
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
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(trade.entry_date)}
                  </td>
                  <td className="py-3 px-3 font-medium">{trade.symbol}</td>
                  <td className="py-3 px-3">
                    <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'} className="whitespace-nowrap">
                      {trade.direction === 'LONG' ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {trade.direction}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right font-mono whitespace-nowrap">{trade.entry_price.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                    {trade.exit_price?.toFixed(2) || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{trade.quantity}</td>
                  <td className={`py-3 px-3 text-right font-mono whitespace-nowrap ${pnl !== null ? (isProfit ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                    {pnl !== null ? formatCurrency(pnl) : 'OPEN'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="outline" className="text-[11px]">{trade.trade_type}</Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/trades/${trade.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 min-w-[32px] text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => onDelete(trade.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/trade-replay?tradeId=${trade.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 min-w-[32px]">
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {trades.map((trade) => {
          const pnl = trade.status === 'CLOSED' && trade.exit_price
            ? calculatePnL(trade)
            : null
          const isProfit = pnl !== null && pnl >= 0

          return (
            <div key={trade.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{trade.symbol}</span>
                  <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'} className="text-[11px]">
                    {trade.direction === 'LONG' ? (
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    )}
                    {trade.direction}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">{trade.trade_type}</Badge>
                </div>
                <span className={`text-base font-bold ${pnl !== null ? (isProfit ? 'text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                  {pnl !== null ? formatCurrency(pnl) : 'OPEN'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground text-[11px]">Entry</span>
                  <p className="font-mono font-medium">${trade.entry_price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Exit</span>
                  <p className="font-mono font-medium">{trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Qty</span>
                  <p className="font-mono font-medium">{trade.quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Date</span>
                  <p className="font-medium whitespace-nowrap">{formatDate(trade.entry_date)}</p>
                </div>
                {trade.strategy && (
                  <div>
                    <span className="text-muted-foreground text-[11px]">Strategy</span>
                    <p className="font-medium truncate">{trade.strategy}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Link href={`/trades/${trade.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/trade-replay?tradeId=${trade.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Replay
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => onDelete(trade.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
