export interface CmeContract {
  symbol: string
  name: string
  exchange: string
  category: 'Index' | 'Commodity' | 'Energy' | 'Interest Rate' | 'Currency' | 'Agriculture' | 'Metal'
  multiplier: number
  tickSize: number
  tickValue: number
  currency: string
}

const contracts: CmeContract[] = [
  // === INDEX FUTURES ===
  { symbol: 'ES', name: 'E-mini S&P 500', exchange: 'CME', category: 'Index', multiplier: 50, tickSize: 0.25, tickValue: 12.50, currency: 'USD' },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', exchange: 'CME', category: 'Index', multiplier: 5, tickSize: 0.25, tickValue: 1.25, currency: 'USD' },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100', exchange: 'CME', category: 'Index', multiplier: 20, tickSize: 0.25, tickValue: 5.00, currency: 'USD' },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100', exchange: 'CME', category: 'Index', multiplier: 2, tickSize: 0.25, tickValue: 0.50, currency: 'USD' },
  { symbol: 'RTY', name: 'E-mini Russell 2000', exchange: 'CME', category: 'Index', multiplier: 50, tickSize: 0.10, tickValue: 5.00, currency: 'USD' },
  { symbol: 'MRTY', name: 'Micro E-mini Russell 2000', exchange: 'CME', category: 'Index', multiplier: 5, tickSize: 0.10, tickValue: 0.50, currency: 'USD' },
  { symbol: 'YM', name: 'Mini Dow Jones ($5)', exchange: 'CBOT', category: 'Index', multiplier: 5, tickSize: 1, tickValue: 5.00, currency: 'USD' },
  { symbol: 'MYM', name: 'Micro Dow Jones', exchange: 'CBOT', category: 'Index', multiplier: 0.50, tickSize: 1, tickValue: 0.50, currency: 'USD' },
  { symbol: 'VX', name: 'VIX Volatility Index', exchange: 'CFE', category: 'Index', multiplier: 1000, tickSize: 0.05, tickValue: 50.00, currency: 'USD' },

  // === METALS ===
  { symbol: 'GC', name: 'Gold', exchange: 'COMEX', category: 'Metal', multiplier: 100, tickSize: 0.10, tickValue: 10.00, currency: 'USD' },
  { symbol: 'MGC', name: 'Micro Gold', exchange: 'COMEX', category: 'Metal', multiplier: 10, tickSize: 0.10, tickValue: 1.00, currency: 'USD' },
  { symbol: 'SI', name: 'Silver', exchange: 'COMEX', category: 'Metal', multiplier: 5000, tickSize: 0.005, tickValue: 25.00, currency: 'USD' },
  { symbol: 'SIL', name: 'Micro Silver', exchange: 'COMEX', category: 'Metal', multiplier: 1000, tickSize: 0.01, tickValue: 10.00, currency: 'USD' },
  { symbol: 'HG', name: 'Copper', exchange: 'COMEX', category: 'Metal', multiplier: 25000, tickSize: 0.0005, tickValue: 12.50, currency: 'USD' },
  { symbol: 'PL', name: 'Platinum', exchange: 'NYMEX', category: 'Metal', multiplier: 50, tickSize: 0.10, tickValue: 5.00, currency: 'USD' },
  { symbol: 'PA', name: 'Palladium', exchange: 'NYMEX', category: 'Metal', multiplier: 100, tickSize: 0.05, tickValue: 5.00, currency: 'USD' },
  { symbol: 'ALI', name: 'Aluminum', exchange: 'COMEX', category: 'Metal', multiplier: 44000, tickSize: 0.0005, tickValue: 22.00, currency: 'USD' },

  // === ENERGY ===
  { symbol: 'CL', name: 'Crude Oil', exchange: 'NYMEX', category: 'Energy', multiplier: 1000, tickSize: 0.01, tickValue: 10.00, currency: 'USD' },
  { symbol: 'MCL', name: 'Micro Crude Oil', exchange: 'NYMEX', category: 'Energy', multiplier: 100, tickSize: 0.01, tickValue: 1.00, currency: 'USD' },
  { symbol: 'NG', name: 'Natural Gas', exchange: 'NYMEX', category: 'Energy', multiplier: 10000, tickSize: 0.001, tickValue: 10.00, currency: 'USD' },
  { symbol: 'HO', name: 'Heating Oil', exchange: 'NYMEX', category: 'Energy', multiplier: 42000, tickSize: 0.0001, tickValue: 4.20, currency: 'USD' },
  { symbol: 'RB', name: 'RBOB Gasoline', exchange: 'NYMEX', category: 'Energy', multiplier: 42000, tickSize: 0.0001, tickValue: 4.20, currency: 'USD' },
  { symbol: 'BZ', name: 'Brent Crude Oil', exchange: 'NYMEX', category: 'Energy', multiplier: 1000, tickSize: 0.01, tickValue: 10.00, currency: 'USD' },

  // === AGRICULTURE ===
  { symbol: 'ZC', name: 'Corn', exchange: 'CBOT', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'ZS', name: 'Soybeans', exchange: 'CBOT', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'ZM', name: 'Soybean Meal', exchange: 'CBOT', category: 'Agriculture', multiplier: 100, tickSize: 0.10, tickValue: 10.00, currency: 'USD' },
  { symbol: 'ZL', name: 'Soybean Oil', exchange: 'CBOT', category: 'Agriculture', multiplier: 60000, tickSize: 0.0001, tickValue: 6.00, currency: 'USD' },
  { symbol: 'ZW', name: 'Wheat', exchange: 'CBOT', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'ZO', name: 'Oats', exchange: 'CBOT', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'KE', name: 'KC HRW Wheat', exchange: 'KCBT', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'GF', name: 'Feeder Cattle', exchange: 'CME', category: 'Agriculture', multiplier: 50000, tickSize: 0.00025, tickValue: 12.50, currency: 'USD' },
  { symbol: 'HE', name: 'Lean Hogs', exchange: 'CME', category: 'Agriculture', multiplier: 40000, tickSize: 0.00025, tickValue: 10.00, currency: 'USD' },
  { symbol: 'LE', name: 'Live Cattle', exchange: 'CME', category: 'Agriculture', multiplier: 40000, tickSize: 0.00025, tickValue: 10.00, currency: 'USD' },
  { symbol: 'CC', name: 'Cocoa', exchange: 'ICE', category: 'Agriculture', multiplier: 10, tickSize: 1, tickValue: 10.00, currency: 'USD' },
  { symbol: 'CT', name: 'Cotton', exchange: 'ICE', category: 'Agriculture', multiplier: 50000, tickSize: 0.0001, tickValue: 5.00, currency: 'USD' },
  { symbol: 'KC', name: 'Coffee', exchange: 'ICE', category: 'Agriculture', multiplier: 37500, tickSize: 0.0005, tickValue: 18.75, currency: 'USD' },
  { symbol: 'SB', name: 'Sugar', exchange: 'ICE', category: 'Agriculture', multiplier: 112000, tickSize: 0.0001, tickValue: 11.20, currency: 'USD' },
  { symbol: 'OJ', name: 'Orange Juice', exchange: 'ICE', category: 'Agriculture', multiplier: 15000, tickSize: 0.0005, tickValue: 7.50, currency: 'USD' },
  { symbol: 'MW', name: 'Spring Wheat', exchange: 'MGEX', category: 'Agriculture', multiplier: 5000, tickSize: 0.0025, tickValue: 12.50, currency: 'USD' },

  // === INTEREST RATES ===
  { symbol: 'ZB', name: 'U.S. Treasury Bond', exchange: 'CBOT', category: 'Interest Rate', multiplier: 1000, tickSize: 1.0/32, tickValue: 31.25, currency: 'USD' },
  { symbol: 'ZN', name: '10-Year T-Note', exchange: 'CBOT', category: 'Interest Rate', multiplier: 1000, tickSize: 0.5/32, tickValue: 15.625, currency: 'USD' },
  { symbol: 'ZF', name: '5-Year T-Note', exchange: 'CBOT', category: 'Interest Rate', multiplier: 1000, tickSize: 0.25/32, tickValue: 7.8125, currency: 'USD' },
  { symbol: 'ZT', name: '2-Year T-Note', exchange: 'CBOT', category: 'Interest Rate', multiplier: 2000, tickSize: 0.25/32, tickValue: 15.625, currency: 'USD' },
  { symbol: 'UB', name: 'Ultra T-Bond', exchange: 'CBOT', category: 'Interest Rate', multiplier: 1000, tickSize: 1.0/32, tickValue: 31.25, currency: 'USD' },

  // === CURRENCIES ===
  { symbol: '6E', name: 'Euro FX', exchange: 'CME', category: 'Currency', multiplier: 125000, tickSize: 0.00005, tickValue: 6.25, currency: 'USD' },
  { symbol: '6B', name: 'British Pound', exchange: 'CME', category: 'Currency', multiplier: 62500, tickSize: 0.0001, tickValue: 6.25, currency: 'USD' },
  { symbol: '6J', name: 'Japanese Yen', exchange: 'CME', category: 'Currency', multiplier: 12500000, tickSize: 0.0000005, tickValue: 6.25, currency: 'USD' },
  { symbol: '6A', name: 'Australian Dollar', exchange: 'CME', category: 'Currency', multiplier: 100000, tickSize: 0.0001, tickValue: 10.00, currency: 'USD' },
  { symbol: '6C', name: 'Canadian Dollar', exchange: 'CME', category: 'Currency', multiplier: 100000, tickSize: 0.00005, tickValue: 5.00, currency: 'USD' },
  { symbol: '6N', name: 'New Zealand Dollar', exchange: 'CME', category: 'Currency', multiplier: 100000, tickSize: 0.0001, tickValue: 10.00, currency: 'USD' },
  { symbol: '6S', name: 'Swiss Franc', exchange: 'CME', category: 'Currency', multiplier: 125000, tickSize: 0.0001, tickValue: 12.50, currency: 'USD' },
  { symbol: '6M', name: 'Mexican Peso', exchange: 'CME', category: 'Currency', multiplier: 500000, tickSize: 0.00001, tickValue: 5.00, currency: 'USD' },
  { symbol: '6Z', name: 'South African Rand', exchange: 'CME', category: 'Currency', multiplier: 500000, tickSize: 0.0005, tickValue: 25.00, currency: 'USD' },
]

const contractMap = new Map<string, CmeContract>(
  contracts.map(c => [c.symbol, c])
)

const MONTH_CODES = new Set(['F','G','H','J','K','M','N','Q','U','V','X','Z'])

export function normalizeSymbol(raw: string): string {
  const upper = raw.toUpperCase().trim()
  // Full match first
  if (contractMap.has(upper)) return upper
  // Strip futures month/year suffix: e.g. MGCM6 -> MGC, ESZ5 -> ES, NQH26 -> NQ
  // Month is a letter FGHJKMNQUVXZ, year is 0-9
  // The base symbol is the longest prefix that exists in the contract map
  for (let len = upper.length - 2; len >= 1; len--) {
    const candidate = upper.slice(0, len)
    if (contractMap.has(candidate)) return candidate
  }
  return upper
}

export function getContract(symbol: string): CmeContract | undefined {
  return contractMap.get(normalizeSymbol(symbol))
}

export function getMultiplier(symbol: string): number {
  return contractMap.get(normalizeSymbol(symbol))?.multiplier ?? 1
}

export function searchContracts(query: string): CmeContract[] {
  const q = query.toUpperCase()
  if (!q) return []
  return contracts.filter(c =>
    c.symbol.startsWith(q) ||
    c.name.toUpperCase().includes(q)
  ).slice(0, 10)
}

export function getAllCategories() {
  return [...new Set(contracts.map(c => c.category))]
}

export function getContractsByCategory(category: string): CmeContract[] {
  return contracts.filter(c => c.category === category)
}
