import { Tooltip as T } from 'radix-ui'
import { cn } from '@/utils/cn'

export const TooltipProvider = T.Provider

export function Tip({ label, children, side = 'top' }) {
  return (
    <T.Root delayDuration={200}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-[1200] animate-fade rounded-lg bg-ink px-2.5 py-1.5 text-s6 text-white">{label}</T.Content>
      </T.Portal>
    </T.Root>
  )
}

const TONES = {
  soft: 'bg-brand-100 text-brand-800',
  solid: 'bg-brand-700 text-white',
  outline: 'border border-brand-300 bg-white text-brand-800',
  danger: 'bg-danger text-white',
  mute: 'bg-mute text-ink-soft',
}

export function Badge({ tone = 'soft', className, ...props }) {
  return <span className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-s6 font-semibold whitespace-nowrap', TONES[tone], className)} {...props} />
}

export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-brand-100', className)} {...props} />
}
