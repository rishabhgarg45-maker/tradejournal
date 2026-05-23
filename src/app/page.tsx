import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-10 w-10 text-primary" />
        <span className="text-3xl font-bold">TradeJournal</span>
      </div>
      <h1 className="text-4xl font-bold mb-4">
        Track, Analyze & Improve Your Trading
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        The professional trading journal that helps you log trades, track performance, and make data-driven decisions.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg">Sign In</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline" size="lg">Get Started</Button>
        </Link>
      </div>
    </div>
  )
}
