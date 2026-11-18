import { Tabs as T } from 'radix-ui'
import { cn } from '@/utils/cn'

export const Tabs = T.Root
export const TabsContent = T.Content

export function TabsList({ className, ...props }) {
  return <T.List className={cn('inline-flex gap-1 rounded-control bg-brand-100 p-1', className)} {...props} />
}

export function TabsTrigger({ className, ...props }) {
  return <T.Trigger className={cn('cursor-pointer rounded-lg px-3 py-1.5 text-s5 font-semibold text-brand-800 transition hover:bg-brand-200/60 focus-visible:outline-2 focus-visible:outline-brand-700 data-[state=active]:bg-white data-[state=active]:text-brand-700 data-[state=active]:shadow-soft', className)} {...props} />
}
