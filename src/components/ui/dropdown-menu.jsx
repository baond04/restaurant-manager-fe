import { DropdownMenu as M } from 'radix-ui'
import { cn } from '@/utils/cn'

export const DropdownMenu = M.Root
export const DropdownMenuTrigger = M.Trigger

export function DropdownMenuContent({ className, align = 'end', sideOffset = 6, ...props }) {
  return (
    <M.Portal>
      <M.Content align={align} sideOffset={sideOffset} className={cn('z-[1100] min-w-44 animate-fade rounded-panel border border-brand-100 bg-white p-1 shadow-float', className)} {...props} />
    </M.Portal>
  )
}

export function DropdownMenuItem({ danger, className, ...props }) {
  return <M.Item className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-s4 outline-none', danger ? 'text-danger data-[highlighted]:bg-mute' : 'text-ink data-[highlighted]:bg-brand-100 data-[highlighted]:text-brand-900', className)} {...props} />
}
