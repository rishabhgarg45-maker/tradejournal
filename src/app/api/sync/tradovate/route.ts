import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { authenticate, getFills, getAccounts } from '@/lib/tradovate'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { username, password, appId, appSecret, useDemo } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const credsAppId = appId || 'TradeJournal'
    const credentials = await authenticate(username, password, credsAppId, '1.0', useDemo, appSecret)
    const accounts = await getAccounts(username, password, credsAppId, useDemo)

    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const fills = await getFills(username, password, startDate, endDate, appId || 'TradeJournal', useDemo)

    let imported = 0
    for (const fill of fills) {
      const existing = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
        .eq('symbol', `${fill.contractId}`)
        .eq('entry_date', new Date(fill.timestamp).toISOString())
        .maybeSingle()

      if (!existing.data) {
        await supabase.from('trades').insert({
          user_id: user.id,
          symbol: `${fill.contractId}`,
          direction: fill.action === 'Buy' ? 'LONG' : 'SHORT',
          entry_price: fill.price,
          quantity: fill.qty,
          entry_date: new Date(fill.timestamp).toISOString(),
          fees: 0,
          trade_type: 'DAY',
          status: 'CLOSED',
          tags: ['tradovate'],
        })
        imported++
      }
    }

    await supabase.from('brokerage_accounts').upsert({
      user_id: user.id,
      provider: 'tradovate',
      account_id: `tradovate_${credentials.userId}`,
      account_name: accounts[0]?.name || `Tradovate (${useDemo ? 'Demo' : 'Live'})`,
      is_connected: true,
    }, { onConflict: 'user_id,provider,account_id' })

    return NextResponse.json({
      success: true,
      account: accounts[0]?.name || 'Tradovate',
      trades_imported: imported,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
