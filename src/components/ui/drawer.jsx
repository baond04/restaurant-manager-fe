import { Drawer as V } from 'vaul'
import { cn } from '@/utils/cn'

export const Drawer = V.Root

export function DrawerContent({ title, hideHeader, className, children, ...props }) {
  return (
    <V.Portal>
      <V.Overlay className="fixed inset-0 z-[1000] bg-ink/45" />
      <V.Content aria-describedby={undefined} className={cn('fixed inset-x-0 bottom-0 z-[1000] mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-site bg-white outline-none', className)} {...props}>
        <div aria-hidden="true" className="mx-auto mt-2.5 mb-1 h-1.5 w-11 shrink-0 rounded-full bg-brand-200" />
        {hideHeader ? <V.Title className="sr-only">{title}</V.Title> : <V.Title className="shrink-0 px-5 pt-2 pb-3 text-s2 font-bold text-ink">{title}</V.Title>}
        {children}
      </V.Content>
    </V.Portal>
  )
}
