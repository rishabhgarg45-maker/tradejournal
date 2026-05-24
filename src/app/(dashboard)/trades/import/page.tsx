'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

const REQUIRED_FIELDS = ['symbol', 'direction', 'entry_price', 'quantity', 'entry_date'] as const
const OPTIONAL_FIELDS = ['exit_price', 'exit_date', 'fees', 'trade_type', 'strategy', 'notes'] as const
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

export default function ImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [columnMap, setColumnMap] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(reader.result as string)
      parsePreview(reader.result as string)
    }
    reader.readAsText(file)
  }

  const parsePreview = (text: string) => {
    setError('')
    setResult(null)
    if (!text.trim()) { setHeaders([]); setPreviewRows([]); return }

    const lines = text.trim().split('\n')
    const h = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    setHeaders(h)

    const rows = lines.slice(1, 6).map(line => {
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
    })
    setPreviewRows(rows)

    const lower = h.map(x => x.toLowerCase().replace(/[\s_-]/g, ''))
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

    const map: Record<string, string> = {}
    const used = new Set<number>()
    for (const field of ALL_FIELDS) {
      const idx = lower.findIndex((h, i) => {
        if (used.has(i)) return false
        return (aliases[field] || [field]).some(a => h === a)
      })
      if (idx !== -1) {
        map[field] = h[idx]
        used.add(idx)
      }
    }
    setColumnMap(map)
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, columnMap }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.unmatched) {
          setError(`Could not auto-detect columns: ${data.unmatched.join(', ')}. Use the dropdowns to map them manually.`)
        } else {
          setError(data.error || 'Import failed')
        }
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/trades" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Import Trades from CSV</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Paste or Upload CSV</CardTitle>
          <CardDescription>
            Export your trades from Tradovate (or any broker) as CSV and paste below. 
            The first row must be column headers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <span className="text-xs text-muted-foreground">
              or paste below
            </span>
          </div>

          <Textarea
            placeholder={`Paste CSV data here...\n\nExample:\nSymbol,Direction,Entry Price,Qty,Date\nES,LONG,4500.25,1,2025-01-15\nNQ,SHORT,19500.50,2,2025-01-16`}
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); parsePreview(e.target.value) }}
            rows={8}
            className="font-mono text-xs"
          />

          {headers.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      {headers.map((h, i) => (
                        <th key={i} className="text-left p-2 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-t border-border">
                        {row.map((cell, ci) => (
                          <td key={ci} className="p-2 whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Column Mapping</p>
                <p className="text-xs text-muted-foreground">
                  Map your CSV columns to trade fields. Required fields are marked with *.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ALL_FIELDS.map(field => {
                    const isRequired = REQUIRED_FIELDS.includes(field as any)
                    const mapped = columnMap[field]
                    return (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">
                          {field.replace(/_/g, ' ')}
                          {isRequired && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        <Select
                          value={mapped || ''}
                          onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                          className="text-xs h-8"
                        >
                          <option value="">— skip —</option>
                          {headers.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </Select>
                      </div>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-md bg-red-500/10 text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {result && (
                <div className={`flex items-start gap-2 text-sm p-3 rounded-md ${result.imported > 0 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Imported {result.imported} trades</p>
                    {result.skipped > 0 && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {result.skipped} rows skipped
                        {result.errors.length > 0 && (
                          <span className="block mt-1 whitespace-pre-wrap">
                            {result.errors.slice(0, 5).map((e, i) => (
                              <span key={i} className="block">{e}</span>
                            ))}
                            {result.errors.length > 5 && <span>...and {result.errors.length - 5} more</span>}
                          </span>
                        )}
                      </p>
                    )}
                    <Link href="/trades">
                      <Button variant="link" className="h-auto p-0 text-xs mt-2">
                        View all trades →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
                  {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {importing ? 'Importing...' : 'Import Trades'}
                </Button>
                <Button variant="outline" onClick={() => { setCsvText(''); setHeaders([]); setPreviewRows([]); setResult(null); setError('') }}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
