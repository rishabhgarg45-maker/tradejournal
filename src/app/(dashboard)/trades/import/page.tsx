'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
    total: number
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
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Import failed')
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
          <CardTitle className="text-sm">Upload or Paste CSV</CardTitle>
          <CardDescription>
            The API auto-detects common formats — Tradovate, TradingView, and standard entry/exit CSVs all work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV File
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>

          <Textarea
            placeholder="Paste CSV data here..."
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
                    <p className="font-medium">Imported {result.imported} of {result.total} trades</p>
                    {result.skipped > 0 && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {result.skipped} rows skipped
                        {result.errors.length > 0 && (
                          <span className="block mt-1 whitespace-pre-wrap">
                            {result.errors.slice(0, 10).map((e, i) => (
                              <span key={i} className="block">{e}</span>
                            ))}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="flex gap-3 mt-3">
                      <Link href="/trades">
                        <Button size="sm">View Trades</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => { setCsvText(''); setHeaders([]); setPreviewRows([]); setResult(null); setError('') }}>
                        Import Another
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!result && !error && (
                <Button onClick={handleImport} disabled={importing || !csvText.trim()}>
                  {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {importing ? 'Importing...' : 'Import Trades'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
