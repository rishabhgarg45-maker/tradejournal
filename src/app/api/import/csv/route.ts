import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getContract } from '@/lib/cme-futures'

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

interface IndexMap {
  symbol?: number
  quantity?: number
  buyPrice?: number
  sellPrice?: number
  boughtTimestamp?: number
  soldTimestamp?: number
  entry_price?: number
  exit_price?: number
  entry_date?: number
  exit_date?: number
  direction?: number
  fees?: number
  strategy?: number
  notes?: number
  trade_type?: number
  pnl?: number
}

function parseValue(val: string): string {
  return val.replace(/^"|"$/g, '').trim()
}

function parseNumber(val: string): number | null {
  const cleaned = val.replace(/[$,()]/g, '').trim()
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseDirection(val: string): 'LONG' | 'SHORT' | null {
  const lower = val.toLowerCase()
  if (['buy', 'long', 'b', 'l', 'buying'].includes(lower)) return 'LONG'
  if (['sell', 'short', 's', 'sh', 'selling'].includes(lower)) return 'SHORT'
  return null
}

function parseDate(val: string): string | null {
  const cleaned = val.replace(/^"|"$/g, '').trim()
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d.toISOString()
  const mdy = /(\d{1,2})\/(\d{1,2})\/(\d{4})[\s-]?(\d{1,2}:\d{2}(?::\d{2})?)?/.exec(cleaned)
  if (mdy) {
    const dt = new Date(`${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T${mdy[4] || '00:00:00'}`)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }
  const ymd = /(\d{4})(\d{2})(\d{2})/.exec(cleaned)
  if (ymd) {
    return new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}`).toISOString()
  }
  return null
}

function detectColumns(headers: string[]): IndexMap {
  const lower = headers.map(h => h.toLowerCase().replace(/[\s_-]/g, ''))
  const map: IndexMap = {}
  const used = new Set<number>()

  const aliases: Record<string, string[]> = {
    symbol: ['symbol', 'instrument', 'contract', 'ticker', 'pair', 'name'],
    quantity: ['quantity', 'qty', 'size', 'shares', 'lots', 'volume', 'amount', 'contracts'],
    buyPrice: ['buyprice', 'buy', 'entryprice'],
    sellPrice: ['sellprice', 'sell', 'exitprice'],
    boughtTimestamp: ['boughttimestamp', 'bought', 'entrytime', 'entrydate', 'opendate', 'opentime'],
    soldTimestamp: ['soldtimestamp', 'sold', 'exittime', 'exitdate', 'closedate', 'closetime'],
    entry_price: ['entry_price', 'entryprice', 'entry', 'openprice', 'price', 'fillprice'],
    exit_price: ['exit_price', 'exitprice', 'exit', 'closeprice'],
    entry_date: ['entry_date', 'entrydate', 'entrytime', 'date', 'datetime', 'timestamp', 'opendate', 'tradedate', 'time'],
    exit_date: ['exit_date', 'exitdate', 'exittime', 'closedate', 'closetime'],
    direction: ['direction', 'side', 'action', 'type', 'buysell', 'signal', 'ordertype'],
    fees: ['fees', 'commission', 'cost', 'expenses'],
    strategy: ['strategy', 'system', 'method'],
    notes: ['notes', 'note', 'comment', 'comments', 'description'],
    trade_type: ['trade_type', 'tradetype', 'type', 'ordertype'],
    pnl: ['pnl', 'pl', 'profit', 'loss', 'result', 'netpnl'],
  }

  for (const [field, names] of Object.entries(aliases)) {
    const idx = lower.findIndex((h, i) => !used.has(i) && names.includes(h))
    if (idx !== -1) {
      ;(map as any)[field] = idx
      used.add(idx)
    }
  }

  return map
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { csv } = await request.json()
    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }

    const { headers, rows } = parseCSV(csv)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows found in CSV' }, { status: 400 })
    }

    const cols = detectColumns(headers)

    if (cols.symbol === undefined || cols.quantity === undefined) {
      return NextResponse.json({
        error: 'Could not detect required columns (symbol, qty)',
        headers,
        rows: rows.slice(0, 5),
      }, { status: 400 })
    }

    const hasBuySellPrices = cols.buyPrice !== undefined && cols.sellPrice !== undefined
    const hasTimestamps = cols.boughtTimestamp !== undefined && cols.soldTimestamp !== undefined
    const hasDirection = cols.direction !== undefined
    const hasEntryExit = cols.entry_price !== undefined
    const hasEntryDate = cols.entry_date !== undefined

    const tradingViewFormat = hasBuySellPrices && hasTimestamps
    const standardFormat = hasEntryExit && hasEntryDate && hasDirection

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const get = (idx: number | undefined) => idx !== undefined ? parseValue(row[idx] || '') : ''

      const symbol = get(cols.symbol)
      const qty = parseNumber(get(cols.quantity))

      if (!symbol || !qty) {
        skipped++
        errors.push(`Row ${i + 2}: missing symbol or quantity`)
        continue
      }

      let direction: 'LONG' | 'SHORT'
      let entryPrice: number | null
      let exitPrice: number | null
      let entryDate: string | null
      let exitDate: string | null
      let fees = parseNumber(get(cols.fees)) || 0

      if (tradingViewFormat) {
        const buyPrice = parseNumber(get(cols.buyPrice))
        const sellPrice = parseNumber(get(cols.sellPrice))
        const boughtDate = parseDate(get(cols.boughtTimestamp))
        const soldDate = parseDate(get(cols.soldTimestamp))

        if (!buyPrice || !sellPrice || !boughtDate || !soldDate) {
          skipped++
          errors.push(`Row ${i + 2}: invalid price or date data`)
          continue
        }

        const boughtTime = new Date(boughtDate).getTime()
        const soldTime = new Date(soldDate).getTime()

        if (boughtTime <= soldTime) {
          direction = 'LONG'
          entryPrice = buyPrice
          exitPrice = sellPrice
          entryDate = boughtDate
          exitDate = soldDate
        } else {
          direction = 'SHORT'
          entryPrice = sellPrice
          exitPrice = buyPrice
          entryDate = soldDate
          exitDate = boughtDate
        }
      } else if (standardFormat) {
        const dirStr = get(cols.direction)
        const dir = parseDirection(dirStr)
        if (!dir) {
          skipped++
          errors.push(`Row ${i + 2}: invalid direction "${dirStr}"`)
          continue
        }
        direction = dir
        entryPrice = parseNumber(get(cols.entry_price))
        exitPrice = parseNumber(get(cols.exit_price))
        entryDate = parseDate(get(cols.entry_date))
        exitDate = parseDate(get(cols.exit_date))

        if (!entryPrice || !entryDate) {
          skipped++
          errors.push(`Row ${i + 2}: missing entry price or date`)
          continue
        }
      } else if (cols.entry_price !== undefined && cols.exit_price !== undefined && cols.entry_date !== undefined && hasDirection) {
        const dirStr = get(cols.direction)
        const dir = parseDirection(dirStr)
        if (!dir) {
          skipped++
          errors.push(`Row ${i + 2}: invalid direction "${dirStr}"`)
          continue
        }
        direction = dir
        entryPrice = parseNumber(get(cols.entry_price))
        exitPrice = parseNumber(get(cols.exit_price))
        entryDate = parseDate(get(cols.entry_date))
        exitDate = parseDate(get(cols.exit_date))

        if (!entryPrice || !entryDate) {
          skipped++
          errors.push(`Row ${i + 2}: missing entry price or date`)
          continue
        }
      } else {
        skipped++
        errors.push(`Row ${i + 2}: unrecognized CSV format`)
        continue
      }

      const strategy = cols.strategy !== undefined ? get(cols.strategy) || null : null
      const notes = cols.notes !== undefined ? get(cols.notes) || null : null
      let tradeType = cols.trade_type !== undefined ? get(cols.trade_type) : 'DAY'
      if (!['DAY', 'SWING', 'SCALP'].includes(tradeType)) tradeType = 'DAY'

      const contract = getContract(symbol)
      const contractMultiplier = contract?.multiplier ?? null
      const contractName = contract?.name ?? null

      const { error } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        direction,
        entry_price: entryPrice,
        exit_price: exitPrice || null,
        quantity: qty,
        entry_date: entryDate,
        exit_date: exitDate || null,
        fees,
        strategy,
        notes,
        trade_type: tradeType,
        status: exitDate ? 'CLOSED' : 'OPEN',
        contract_multiplier: contractMultiplier,
        contract_name: contractName,
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
