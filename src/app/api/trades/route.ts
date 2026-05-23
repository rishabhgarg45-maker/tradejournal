import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const symbol = searchParams.get('symbol')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'entry_date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (symbol) query = query.ilike('symbol', `%${symbol}%`)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ trades: data, total: count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol: body.symbol,
        direction: body.direction,
        entry_price: body.entry_price,
        exit_price: body.exit_price || null,
        quantity: body.quantity,
        entry_date: body.entry_date,
        exit_date: body.exit_date || null,
        stop_loss: body.stop_loss || null,
        take_profit: body.take_profit || null,
        fees: body.fees || 0,
        strategy: body.strategy || null,
        setup: body.setup || null,
        tags: body.tags || [],
        notes: body.notes || null,
        trade_type: body.trade_type,
        status: body.exit_price ? 'CLOSED' : 'OPEN',
        contract_multiplier: body.contract_multiplier || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ trade: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
