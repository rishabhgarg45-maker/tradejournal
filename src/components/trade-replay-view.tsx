'use client'

import { Trade } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculatePnL } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, TrendingDown } from 'lucide-react'

interface TradeReplayProps {
  trade: Trade | null
  loading: boolean
}

export function TradeReplayView({ trade, loading }: TradeReplayProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!trade) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <p>Select a trade to replay</p>
        </CardContent>
      </Card>
    )
  }

  const pnl = trade.status === 'CLOSED' && trade.exit_price ? calculatePnL(trade) : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{trade.symbol}</CardTitle>
              <Badge variant={trade.direction === 'LONG' ? 'success' : 'danger'}>
                {trade.direction === 'LONG' ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {trade.direction}
              </Badge>
              <Badge variant="outline">{trade.trade_type}</Badge>
            </div>
            {pnl !== null && (
              <div className={`text-2xl font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(pnl)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entry Price</p>
              <p className="text-lg font-mono font-semibold">${trade.entry_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Exit Price</p>
              <p className="text-lg font-mono font-semibold">
                {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quantity</p>
              <p className="text-lg font-mono font-semibold">{trade.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stop Loss</p>
              <p className="text-lg font-mono font-semibold">
                {trade.stop_loss ? `$${trade.stop_loss.toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trade Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Entry</p>
                <p className="text-xs text-muted-foreground">{formatDate(trade.entry_date)}</p>
                <p className="text-xs text-muted-foreground">Price: ${trade.entry_price.toFixed(2)}</p>
              </div>
            </div>
            {trade.exit_date && (
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full ${pnl && pnl >= 0 ? 'bg-green-500' : 'bg-red-500'} mt-1.5 shrink-0`} />
                <div>
                  <p className="text-sm font-medium">Exit</p>
                  <p className="text-xs text-muted-foreground">{formatDate(trade.exit_date)}</p>
                  <p className="text-xs text-muted-foreground">Price: ${trade.exit_price?.toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trade Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trade.strategy && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Strategy</span>
                <span className="text-sm font-medium">{trade.strategy}</span>
              </div>
            )}
            {trade.setup && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Setup</span>
                <span className="text-sm font-medium">{trade.setup}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fees</span>
              <span className="text-sm font-medium">{formatCurrency(trade.fees)}</span>
            </div>
            {trade.tags && trade.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {trade.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {trade.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{trade.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
