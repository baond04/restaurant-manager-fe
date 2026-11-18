import { Check, ChevronDown } from 'lucide-react'
import { Select as S } from 'radix-ui'
import { cn } from '@/utils/cn'

/** Dropdown. options: [{ value, label, disabled }]. value giữ nguyên kiểu số hoặc chuỗi. */
export function Select({ value, onValueChange, options, placeholder = 'Chọn', className, disabled, 'aria-label': label, id, ...rest }) {
  const pick = (v) => onValueChange(options.find((o) => String(o.value) === v)?.value)
  return (
    <S.Root value={value === undefined || value === null ? undefined : String(value)} onValueChange={pick} disabled={disabled}>
      <S.Trigger id={id} aria-label={label} {...rest} className={cn('flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-brand-200 bg-white px-3 text-s4 text-ink transition hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-brand-700 disabled:bg-mute data-[placeholder]:text-ink-soft', className)}>
        <span className="truncate"><S.Value placeholder={placeholder} /></span>
        <S.Icon><ChevronDown size={16} className="text-brand-700" aria-hidden="true" /></S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={6} className="z-[1100] max-h-72 min-w-[var(--radix-select-trigger-width)] animate-fade overflow-hidden rounded-panel border border-brand-100 bg-white shadow-float">
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item key={o.value} value={String(o.value)} disabled={o.disabled} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-s4 text-ink outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-ink-soft data-[disabled]:opacity-60 data-[highlighted]:bg-brand-100 data-[highlighted]:text-brand-900">
                <S.ItemText>{o.label}</S.ItemText>
                <S.ItemIndicator><Check size={16} className="text-brand-700" aria-hidden="true" /></S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
