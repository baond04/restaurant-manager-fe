import { LoaderCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      {Icon && <span className="flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Icon size={26} aria-hidden="true" /></span>}
      <p className="text-s3 font-semibold text-ink">{title}</p>
      {children && <div className="max-w-sm text-s4 text-ink-soft">{children}</div>}
      {action}
    </div>
  )
}

export function PageLoader({ className }) {
  return (
    <div role="status" aria-label="Đang tải" className={cn('flex min-h-dvh items-center justify-center text-brand-700', className)}>
      <LoaderCircle size={32} className="animate-spin" aria-hidden="true" />
    </div>
  )
}
