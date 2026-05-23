import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, apiSecret } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'API key and secret are required' }, { status: 400 })
    }

    const alpacaResponse = await fetch('https://paper-api.alpaca.markets/v2/account', {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    })

    if (!alpacaResponse.ok) {
      return NextResponse.json({ error: 'Invalid Alpaca credentials' }, { status: 400 })
    }

    const account = await alpacaResponse.json()

    const { error: upsertError } = await supabase
      .from('brokerage_accounts')
      .upsert({
        user_id: user.id,
        provider: 'alpaca',
        account_id: account.id,
        account_name: `Alpaca - ${account.account_number}`,
        api_key: apiKey,
        api_secret: apiSecret,
        is_connected: true,
      }, {
        onConflict: 'user_id,provider,account_id',
      })

    if (upsertError) throw upsertError

    const fillsResponse = await fetch(
      `https://paper-api.alpaca.markets/v2/account/activities?activity_type=FILL&after=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}`,
      {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret,
        },
      }
    )

    const fills = await fillsResponse.json()
    let importedCount = 0

    for (const fill of fills) {
      if (fill.side === 'buy' || fill.side === 'sell') {
        const existing = await supabase
          .from('trades')
          .select('id')
          .eq('user_id', user.id)
          .eq('symbol', fill.symbol)
          .eq('entry_date', fill.transaction_time)
          .maybeSingle()

        if (!existing.data) {
          await supabase.from('trades').insert({
            user_id: user.id,
            symbol: fill.symbol,
            direction: fill.side === 'buy' ? 'LONG' : 'SHORT',
            entry_price: parseFloat(fill.price),
            quantity: Math.abs(parseInt(fill.qty)),
            entry_date: fill.transaction_time,
            fees: parseFloat(fill.price) * Math.abs(parseInt(fill.qty)) * 0.0001,
            trade_type: 'DAY',
            status: 'CLOSED',
          })
          importedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      account: account.id,
      trades_imported: importedCount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
