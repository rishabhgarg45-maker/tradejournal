import { useState } from 'react'
import { TradeFormData } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SymbolInput } from '@/components/symbol-input'
import { CmeContract } from '@/lib/cme-futures'

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20),
  direction: z.enum(['LONG', 'SHORT']),
  entry_price: z.string().min(1, 'Entry price is required'),
  exit_price: z.string().optional().or(z.literal('')),
  quantity: z.string().min(1, 'Quantity is required'),
  entry_date: z.string().min(1, 'Entry date is required'),
  exit_date: z.string().optional().or(z.literal('')),
  stop_loss: z.string().optional().or(z.literal('')),
  take_profit: z.string().optional().or(z.literal('')),
  fees: z.string().optional().or(z.literal('')),
  strategy: z.string().optional().or(z.literal('')),
  setup: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  trade_type: z.enum(['DAY', 'SWING', 'SCALP']),
  tags: z.string().optional().or(z.literal('')),
})

type TradeFormValues = z.infer<typeof tradeSchema>

interface TradeFormProps {
  onSubmit: (data: TradeFormData) => Promise<void>
  initialData?: Partial<TradeFormData>
  isEditing?: boolean
}

export function TradeForm({ onSubmit, initialData, isEditing }: TradeFormProps) {
  const [detectedContract, setDetectedContract] = useState<CmeContract | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: initialData?.symbol || '',
      direction: initialData?.direction || 'LONG',
      entry_price: initialData?.entry_price?.toString() || '',
      exit_price: initialData?.exit_price?.toString() || '',
      quantity: initialData?.quantity?.toString() || '',
      entry_date: initialData?.entry_date
        ? new Date(initialData.entry_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      exit_date: initialData?.exit_date
        ? new Date(initialData.exit_date).toISOString().slice(0, 16)
        : '',
      stop_loss: initialData?.stop_loss?.toString() || '',
      take_profit: initialData?.take_profit?.toString() || '',
      fees: initialData?.fees?.toString() || '0',
      strategy: initialData?.strategy || '',
      setup: initialData?.setup || '',
      notes: initialData?.notes || '',
      trade_type: initialData?.trade_type || 'DAY',
      tags: initialData?.tags?.join(', ') || '',
    },
  })

  const onFormSubmit = (data: TradeFormValues) => {
    const tags = data.tags
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    onSubmit({
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      entry_price: parseFloat(data.entry_price),
      exit_price: data.exit_price ? parseFloat(data.exit_price) : undefined,
      quantity: parseInt(data.quantity),
      entry_date: new Date(data.entry_date).toISOString(),
      exit_date: data.exit_date ? new Date(data.exit_date).toISOString() : undefined,
      stop_loss: data.stop_loss ? parseFloat(data.stop_loss) : undefined,
      take_profit: data.take_profit ? parseFloat(data.take_profit) : undefined,
      fees: data.fees ? parseFloat(data.fees) : 0,
      strategy: data.strategy || undefined,
      setup: data.setup || undefined,
      notes: data.notes || undefined,
      trade_type: data.trade_type,
      contract_multiplier: detectedContract?.multiplier,
      tags,
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol</Label>
          <SymbolInput
            value={watch('symbol')}
            onChange={(val) => setValue('symbol', val)}
            onContractDetected={setDetectedContract}
          />
          {errors.symbol && <p className="text-xs text-red-500">{errors.symbol.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select {...register('direction')}>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade_type">Trade Type</Label>
          <Select {...register('trade_type')}>
            <option value="DAY">Day Trade</option>
            <option value="SWING">Swing Trade</option>
            <option value="SCALP">Scalp</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_price">Entry Price</Label>
          <Input id="entry_price" type="number" step="any" placeholder="150.00" {...register('entry_price')} />
          {errors.entry_price && <p className="text-xs text-red-500">{errors.entry_price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exit_price">Exit Price</Label>
          <Input id="exit_price" type="number" step="any" placeholder="155.00" {...register('exit_price')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" placeholder="100" {...register('quantity')} />
          {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_date">Entry Date</Label>
          <Input id="entry_date" type="datetime-local" {...register('entry_date')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exit_date">Exit Date</Label>
          <Input id="exit_date" type="datetime-local" {...register('exit_date')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stop_loss">Stop Loss</Label>
          <Input id="stop_loss" type="number" step="any" placeholder="148.00" {...register('stop_loss')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="take_profit">Take Profit</Label>
          <Input id="take_profit" type="number" step="any" placeholder="160.00" {...register('take_profit')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fees">Fees</Label>
          <Input id="fees" type="number" step="any" placeholder="0.00" {...register('fees')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategy">Strategy</Label>
          <Input id="strategy" placeholder="Breakout" {...register('strategy')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" placeholder="earnings, momentum" {...register('tags')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup">Setup</Label>
        <Input id="setup" placeholder="Bull flag on 5min, high volume" {...register('setup')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} placeholder="Describe your trade..." {...register('notes')} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : isEditing ? 'Update Trade' : 'Log Trade'}
      </Button>
    </form>
  )
}
