import { Check } from 'lucide-react'
import { Checkbox as C, Switch as Sw } from 'radix-ui'
import { cn } from '@/utils/cn'

export function Checkbox({ className, ...props }) {
  return (
    <C.Root className={cn('flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-brand-300 bg-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:bg-mute data-[state=checked]:border-brand-700 data-[state=checked]:bg-brand-700', className)} {...props}>
      <C.Indicator><Check size={14} strokeWidth={3} className="text-white" aria-hidden="true" /></C.Indicator>
    </C.Root>
  )
}

export function Switch({ className, ...props }) {
  return (
    <Sw.Root className={cn('relative h-6 w-10 shrink-0 cursor-pointer rounded-full bg-brand-200 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:bg-mute data-[state=checked]:bg-brand-700', className)} {...props}>
      <Sw.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-soft transition data-[state=checked]:translate-x-[18px]" />
    </Sw.Root>
  )
}
