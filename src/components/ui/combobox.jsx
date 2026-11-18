import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Dropdown có ô tìm không dấu, cho danh sách dài (khách, món). */
export function Combobox({ value, onChange, options, placeholder = 'Chọn', className, 'aria-label': label }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={label} className={cn('flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-brand-200 bg-white px-3 text-s4 hover:border-brand-300', current ? 'text-ink' : 'text-ink-soft', className)}>
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown size={16} className="text-brand-700" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
        <CommandList groups={[{ items: options.map((o) => ({ id: o.value, label: o.label, onSelect: () => { onChange(o.value); setOpen(false) } })) }]} />
      </PopoverContent>
    </Popover>
  )
}
