'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Trade } from '@/types'
import { TradeTable } from '@/components/trade-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function TradesPage() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    loadTrades()
  }, [user])

  const loadTrades = async () => {
    setLoading(true)
    let query = supabase
      .from('trades')
      .select('*')
      .eq('user_id', user!.id)
      .order('entry_date', { ascending: false })

    if (statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    if (data) setTrades(data as Trade[])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('trades').delete().eq('id', id)
    setTrades(trades.filter(t => t.id !== id))
  }

  const filteredTrades = trades.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trades</h1>
        <Link href="/trades/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by symbol..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-32"
        >
          <option value="ALL">All</option>
          <option value="CLOSED">Closed</option>
          <option value="OPEN">Open</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <TradeTable trades={filteredTrades} onDelete={handleDelete} />
      )}
    </div>
  )
}
