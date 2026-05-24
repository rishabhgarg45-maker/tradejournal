'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Trade, TradeFormData } from '@/types'
import { TradeForm } from '@/components/trade-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditTradePage() {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return

    const loadTrade = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (data) setTrade(data as Trade)
      setLoading(false)
    }

    loadTrade()
  }, [user, params.id])

  const handleSubmit = async (formData: TradeFormData) => {
    if (!user || !params.id) return

    const { error } = await supabase
      .from('trades')
      .update({
        symbol: formData.symbol,
        direction: formData.direction,
        entry_price: formData.entry_price,
        exit_price: formData.exit_price || null,
        quantity: formData.quantity,
        entry_date: formData.entry_date,
        exit_date: formData.exit_date || null,
        stop_loss: formData.stop_loss || null,
        take_profit: formData.take_profit || null,
        fees: formData.fees || 0,
        strategy: formData.strategy || null,
        setup: formData.setup || null,
        tags: formData.tags || [],
        notes: formData.notes || null,
        screenshot_url: formData.screenshot_url || null,
        trade_type: formData.trade_type,
        status: formData.exit_price ? 'CLOSED' : 'OPEN',
        contract_multiplier: formData.contract_multiplier ?? null,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (!error) {
      router.push('/trades')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Trade not found
      </div>
    )
  }

  const initialData: Partial<TradeFormData> = {
    symbol: trade.symbol,
    direction: trade.direction,
    entry_price: trade.entry_price,
    exit_price: trade.exit_price || undefined,
    quantity: trade.quantity,
    entry_date: trade.entry_date,
    exit_date: trade.exit_date || undefined,
    stop_loss: trade.stop_loss || undefined,
    take_profit: trade.take_profit || undefined,
    fees: trade.fees,
    strategy: trade.strategy || undefined,
    setup: trade.setup || undefined,
    tags: trade.tags || [],
    notes: trade.notes || undefined,
    trade_type: trade.trade_type,
    screenshot_url: trade.screenshot_url || undefined,
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Trade</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Update Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeForm onSubmit={handleSubmit} initialData={initialData} isEditing />
        </CardContent>
      </Card>
    </div>
  )
}
