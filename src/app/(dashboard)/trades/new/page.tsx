'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { TradeForm } from '@/components/trade-form'
import { TradeFormData } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewTradePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (data: TradeFormData) => {
    if (!user) return

    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      symbol: data.symbol,
      direction: data.direction,
      entry_price: data.entry_price,
      exit_price: data.exit_price || null,
      quantity: data.quantity,
      entry_date: data.entry_date,
      exit_date: data.exit_date || null,
      stop_loss: data.stop_loss || null,
      take_profit: data.take_profit || null,
      fees: data.fees || 0,
      strategy: data.strategy || null,
      setup: data.setup || null,
      tags: data.tags || [],
      notes: data.notes || null,
      trade_type: data.trade_type,
      status: data.exit_price ? 'CLOSED' : 'OPEN',
    })

    if (!error) {
      router.push('/trades')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log New Trade</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trade Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TradeForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
