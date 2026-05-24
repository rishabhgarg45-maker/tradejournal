'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { CmeContract, searchContracts, getContract } from '@/lib/cme-futures'
import { Badge } from '@/components/ui/badge'

interface SymbolInputProps {
  value: string
  onChange: (symbol: string) => void
  onContractDetected?: (contract: CmeContract | null) => void
}

export function SymbolInput({ value, onChange, onContractDetected }: SymbolInputProps) {
  const [suggestions, setSuggestions] = useState<CmeContract[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [detected, setDetected] = useState<CmeContract | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const contract = getContract(value)
    setDetected(contract || null)
    onContractDetected?.(contract || null)

    if (value.length >= 1) {
      const results = searchContracts(value)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder="ES, NQ, XAUUSD, EURUSD..."
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true)
        }}
      />
      {detected && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">{detected.category}</Badge>
          <span className="text-muted-foreground">
            ${detected.multiplier.toLocaleString()} / pt &middot; ${detected.tickValue.toFixed(2)} / tick
          </span>
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((c) => (
            <button
              key={c.symbol}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
              onClick={() => {
                onChange(c.symbol)
                setShowDropdown(false)
              }}
            >
              <div>
                <span className="font-medium">{c.symbol}</span>
                <span className="text-muted-foreground ml-2">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">${c.multiplier.toLocaleString()}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.exchange}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
