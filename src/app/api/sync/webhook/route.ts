import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { validateWebhookTrade } from '@/lib/webhook-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = validateWebhookTrade(body)

    if (!result.valid || !result.trade) {
      return NextResponse.json({ error: result.error || 'Invalid trade data' }, { status: 400 })
    }

    const trade = result.trade

    const { data, error } = await supabase.from('trades').insert({
      user_id: user.id,
      symbol: trade.symbol,
      direction: trade.direction,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price || null,
      quantity: trade.quantity,
      entry_date: trade.entry_date,
      exit_date: trade.exit_date || null,
      stop_loss: trade.stop_loss || null,
      take_profit: trade.take_profit || null,
      fees: trade.fees || 0,
      strategy: trade.strategy || null,
      tags: [trade.broker],
      trade_type: trade.trade_type || 'DAY',
      status: trade.exit_price ? 'CLOSED' : 'OPEN',
    }).select().single()

    if (error) throw error

    return NextResponse.json({ success: true, trade: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
