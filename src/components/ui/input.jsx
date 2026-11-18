import { useId } from 'react'
import { cn } from '@/utils/cn'

const base = 'w-full rounded-control border border-brand-200 bg-white text-s4 text-ink transition placeholder:text-ink-soft hover:border-brand-300 focus:border-brand-700 focus:outline-2 focus:-outline-offset-1 focus:outline-brand-700 disabled:bg-mute disabled:text-ink-soft aria-invalid:border-danger aria-invalid:outline-danger'

export function Input({ className, ...props }) {
  return <input className={cn(base, 'h-10 px-3', className)} {...props} />
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={cn(base, 'resize-y px-3 py-2', className)} {...props} />
}

/** Nhãn, ô nhập và lỗi. children là hàm nhận { id, 'aria-invalid' } để gắn nhãn đúng ô. */
export function Field({ label, error, hint, className, children }) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label htmlFor={id} className="block text-s5 font-medium text-ink">{label}</label>}
      {children({ id, 'aria-invalid': error ? true : undefined })}
      {error ? <p className="text-s5 text-danger">{error}</p> : hint && <p className="text-s5 text-ink-soft">{hint}</p>}
    </div>
  )
}
