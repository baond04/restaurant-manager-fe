import { X } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import { cn } from '@/utils/cn'

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

const closeBtn = 'absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-soft transition hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-700'
const overlay = 'fixed inset-0 z-[1000] animate-fade bg-ink/45'

export function DialogContent({ title, description, className, children, bare, ...props }) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content {...(description ? {} : { 'aria-describedby': undefined })} className={cn('fixed top-1/2 left-1/2 z-[1000] flex max-h-[90dvh] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 animate-panel flex-col overflow-hidden rounded-site bg-white shadow-float outline-none', className)} {...props}>
        {bare ? <D.Title className="sr-only">{title}</D.Title> : (
          <div className="shrink-0 px-6 pt-5 pb-3 pr-14">
            <D.Title className="text-s2 font-bold text-ink">{title}</D.Title>
            {description && <D.Description className="mt-1 text-s4 text-ink-soft">{description}</D.Description>}
          </div>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto', !bare && 'px-6 pb-5')}>{children}</div>
        <D.Close aria-label="Đóng" className={closeBtn}><X size={18} aria-hidden="true" /></D.Close>
      </D.Content>
    </D.Portal>
  )
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('sticky -bottom-5 -mx-6 -mb-5 mt-5 flex justify-end gap-2 border-t border-brand-100 bg-white px-6 py-4', className)} {...props} />
}

export const Sheet = D.Root
export const SheetTrigger = D.Trigger

export function SheetContent({ side = 'right', title, hideHeader, className, children, ...props }) {
  return (
    <D.Portal>
      <D.Overlay className={overlay} />
      <D.Content aria-describedby={undefined} className={cn('fixed inset-y-0 z-[1000] flex w-full max-w-[400px] flex-col bg-white shadow-float outline-none', side === 'right' ? 'right-0 animate-side-r' : 'left-0 animate-side-l', className)} {...props}>
        {hideHeader ? <D.Title className="sr-only">{title}</D.Title> : <div className="flex h-14 shrink-0 items-center border-b border-brand-100 px-5 pr-14"><D.Title className="text-s2 font-bold text-ink">{title}</D.Title></div>}
        {children}
        <D.Close aria-label="Đóng" className={cn(closeBtn, 'top-2.5')}><X size={18} aria-hidden="true" /></D.Close>
      </D.Content>
    </D.Portal>
  )
}
