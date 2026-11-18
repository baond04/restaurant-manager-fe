import { Popover as P } from 'radix-ui'
import { cn } from '@/utils/cn'

export const Popover = P.Root
export const PopoverTrigger = P.Trigger

export function PopoverContent({ className, align = 'start', sideOffset = 6, ...props }) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={sideOffset} className={cn('z-[1100] animate-fade rounded-panel border border-brand-100 bg-white p-3 shadow-float outline-none', className)} {...props} />
    </P.Portal>
  )
}
