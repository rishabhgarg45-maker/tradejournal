'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Trade, TradeStats, EquityPoint, MonthlyPnL } from '@/types'
import { calculateStats, calculateEquityCurve, calculateMonthlyPnL } from '@/lib/calculations'
import { StatsCards } from '@/components/stats-cards'
import { EquityCurve } from '@/components/charts/equity-curve'
import { MonthlyPnLChart } from '@/components/charts/monthly-pnl'
import { TradeTable } from '@/components/trade-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const loadTrades = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })

      if (data) setTrades(data as Trade[])
      setLoading(false)
    }

    loadTrades()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const stats: TradeStats = calculateStats(trades)
  const equityData: EquityPoint[] = calculateEquityCurve(trades)
  const monthlyData: MonthlyPnL[] = calculateMonthlyPnL(trades)
  const recentTrades = trades.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/trades/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={equityData} />
        <MonthlyPnLChart data={monthlyData} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Trades</CardTitle>
            <Link href="/trades">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <TradeTable
            trades={recentTrades}
            onDelete={async (id) => {
              await supabase.from('trades').delete().eq('id', id)
              setTrades(trades.filter(t => t.id !== id))
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
