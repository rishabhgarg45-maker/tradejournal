'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Trade } from '@/types'
import { TradeReplayView } from '@/components/trade-replay-view'
import { Select } from '@/components/ui/select'

export default function TradeReplayPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const tradeIdParam = searchParams.get('tradeId')
  const supabase = createClient()

  const [trades, setTrades] = useState<Trade[]>([])
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTrade, setLoadingTrade] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })

      if (data) {
        setTrades(data as Trade[])
        if (tradeIdParam) {
          const found = data.find((t: Trade) => t.id === tradeIdParam)
          if (found) setSelectedTrade(found as Trade)
        }
      }
      setLoading(false)
    }
    loadTrades()
  }, [user, tradeIdParam])

  const handleSelectTrade = async (tradeId: string) => {
    if (!tradeId) {
      setSelectedTrade(null)
      return
    }
    setLoadingTrade(true)
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single()

    if (data) setSelectedTrade(data as Trade)
    setLoadingTrade(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trade Replay</h1>

      <div className="max-w-sm">
        <Select
          value={selectedTrade?.id || ''}
          onChange={(e) => handleSelectTrade(e.target.value)}
        >
          <option value="">Select a trade to replay...</option>
          {trades.map((trade) => (
            <option key={trade.id} value={trade.id}>
              {trade.symbol} - {new Date(trade.entry_date).toLocaleDateString()} ({trade.direction})
            </option>
          ))}
        </Select>
      </div>

      <TradeReplayView trade={selectedTrade} loading={loadingTrade} />
    </div>
  )
}
