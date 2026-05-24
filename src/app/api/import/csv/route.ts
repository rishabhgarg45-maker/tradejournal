import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const vals: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; continue }
      current += ch
    }
    vals.push(current.trim())
    return vals
  }).filter(r => r.some(v => v))
  return { headers, rows }
}

interface ColumnMap {
  symbol: number
  direction: number
  entry_price: number
  quantity: number
  entry_date: number
  exit_price?: number
  exit_date?: number
  fees?: number
  trade_type?: number
  strategy?: number
  notes?: number
}

function detectColumnMap(headers: string[]): { map: ColumnMap; unmatched: string[] } {
  const lower = headers.map(h => h.toLowerCase().replace(/[\s_-]/g, ''))
  const required = ['symbol', 'direction', 'entry_price', 'quantity', 'entry_date'] as const
  const optional = ['exit_price', 'exit_date', 'fees', 'trade_type', 'strategy', 'notes'] as const

  const aliases: Record<string, string[]> = {
    symbol: ['symbol', 'instrument', 'contract', 'ticker', 'pair', 'name'],
    direction: ['direction', 'side', 'action', 'type', 'buysell', 'signal', 'ordertype'],
    entry_price: ['entry_price', 'entryprice', 'entry', 'openprice', 'price', 'fillprice'],
    quantity: ['quantity', 'qty', 'size', 'shares', 'lots', 'volume', 'amount', 'contracts'],
    entry_date: ['entry_date', 'entrydate', 'entrytime', 'date', 'datetime', 'timestamp', 'opendate', 'tradedate', 'time'],
    exit_price: ['exit_price', 'exitprice', 'exit', 'closeprice'],
    exit_date: ['exit_date', 'exitdate', 'exittime', 'closedate', 'closetime'],
    fees: ['fees', 'commission', 'cost', 'expenses'],
    trade_type: ['trade_type', 'tradetype', 'type', 'ordertype'],
    strategy: ['strategy', 'system', 'method'],
    notes: ['notes', 'note', 'comment', 'comments', 'description'],
  }

  const map: any = {}
  const matched = new Set<number>()
  const unmatched: string[] = []

  for (const field of [...required, ...optional]) {
    const found = lower.findIndex((h, i) => {
      if (matched.has(i)) return false
      return (aliases[field] || [field]).some(a => h === a)
    })
    if (found !== -1) {
      map[field] = found
      matched.add(found)
    } else if (required.includes(field as any)) {
      unmatched.push(field)
    }
  }

  return { map: map as ColumnMap, unmatched }
}

function parseValue(val: string): string {
  return val.replace(/^"|"$/g, '').trim()
}

function parseNumber(val: string): number | null {
  const cleaned = val.replace(/[$,]/g, '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseDirection(val: string): 'LONG' | 'SHORT' | null {
  const lower = val.toLowerCase()
  if (['buy', 'long', 'b', 'l'].includes(lower)) return 'LONG'
  if (['sell', 'short', 's', 'sh'].includes(lower)) return 'SHORT'
  return null
}

function parseDate(val: string): string | null {
  const cleaned = val.replace(/^"|"$/g, '').trim()
  // Try common formats
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString()
  // Try MM/DD/YYYY HH:MM format
  const mdy = /(\d{1,2})\/(\d{1,2})\/(\d{4})[\s-]?(\d{1,2}:\d{2}(?::\d{2})?)?/.exec(cleaned)
  if (mdy) {
    const dt = new Date(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T${mdy[4] || '00:00:00'}`)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }
  // Try YYYYMMDD
  const ymd = /(\d{4})(\d{2})(\d{2})/.exec(cleaned)
  if (ymd) {
    return new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}`).toISOString()
  }
  return null
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { csv, columnMap: customMap } = await request.json()
    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }

    const { headers, rows } = parseCSV(csv)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows found in CSV' }, { status: 400 })
    }

    const { map: autoMap, unmatched } = detectColumnMap(headers)
    const map = customMap || autoMap

    if (!customMap && unmatched.length > 0) {
      return NextResponse.json({
        error: 'Could not auto-detect some required columns',
        headers,
        rows: rows.slice(0, 5),
        unmatched,
        detected: map,
      }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const get = (field: keyof ColumnMap) => {
        const idx = map[field]
        return idx !== undefined ? (row[idx] || '') : ''
      }

      const symbol = parseValue(get('symbol'))
      const dirStr = parseValue(get('direction'))
      const direction = parseDirection(dirStr)
      const entryPrice = parseNumber(get('entry_price'))
      const qty = parseNumber(get('quantity'))
      const entryDate = parseDate(get('entry_date'))

      if (!symbol || !direction || !entryPrice || !qty || !entryDate) {
        skipped++
        const reasons: string[] = []
        if (!symbol) reasons.push(`symbol="${get('symbol')}"`)
        if (!direction) reasons.push(`direction="${dirStr}"`)
        if (!entryPrice) reasons.push(`entry_price="${get('entry_price')}"`)
        if (!qty) reasons.push(`quantity="${get('quantity')}"`)
        if (!entryDate) reasons.push(`entry_date="${get('entry_date')}"`)
        errors.push(`Row ${i + 2}: invalid data - ${reasons.join(', ')}`)
        continue
      }

      const exitPrice = parseNumber(get('exit_price'))
      const exitDate = parseDate(get('exit_date'))
      const fees = parseNumber(get('fees')) || 0
      const strategy = parseValue(get('strategy')) || null
      const notes = parseValue(get('notes')) || null

      let tradeType = parseValue(get('trade_type')) || 'DAY'
      if (!['DAY', 'SWING', 'SCALP'].includes(tradeType)) tradeType = 'DAY'

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        direction,
        entry_price: entryPrice,
        exit_price: exitPrice,
        quantity: qty,
        entry_date: entryDate,
        exit_date: exitDate,
        fees,
        strategy,
        notes,
        trade_type: tradeType,
        status: exitDate ? 'CLOSED' : 'OPEN',
        tags: ['csv-import'],
      })

      if (error) {
        skipped++
        errors.push(`Row ${i + 2}: ${error.message}`)
      } else {
        imported++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 20),
      total: rows.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
