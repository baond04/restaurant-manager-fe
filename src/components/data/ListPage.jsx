import { Pencil, Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Tip } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'

/** Khung trang danh sách: một lớp thẻ, tiêu đề, nút lọc có số đếm, thanh lọc, bảng (plan mục 5.0). */
export function ListPage({ title, actions, chips, filters, children }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-s1 font-bold text-ink">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {chips}
      <div className="min-w-0 overflow-hidden rounded-panel border border-brand-100 bg-white">
        {filters}
        {children}
      </div>
    </div>
  )
}

export function FilterBar({ search, onSearch, placeholder = 'Tìm', onReset, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 p-4">
      {onSearch && (
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute top-3 left-3 text-brand-700" aria-hidden="true" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-9" />
        </div>
      )}
      {children}
      {onReset && <Button variant="ghost" onClick={onReset}><X size={16} aria-hidden="true" />Xóa lọc</Button>}
    </div>
  )
}

/** Nút lọc kèm số đếm. options: [{ value, label, count }]. */
export function StatusChips({ value, onChange, options, className }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={String(o.value)} type="button" aria-pressed={on} onClick={() => onChange(o.value)} className={cn('flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-s5 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700', on ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50')}>
            {o.label}
            {o.count !== undefined && <span className={cn('tabular-nums', on ? 'text-white' : 'text-ink-soft')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, children, confirmLabel = 'Xác nhận', danger, pending, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className="max-w-md">
        {children && <div className="text-s4 text-ink-soft">{children}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RowActions({ onEdit, onDelete, deleteLabel = 'mục này', children }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {children}
      {onEdit && <Tip label="Sửa"><Button variant="ghost" size="icon-sm" aria-label="Sửa" onClick={onEdit}><Pencil size={15} aria-hidden="true" /></Button></Tip>}
      {onDelete && <Tip label="Xóa"><Button variant="ghost" size="icon-sm" aria-label="Xóa" className="text-danger hover:bg-mute" onClick={() => setConfirming(true)}><Trash2 size={15} aria-hidden="true" /></Button></Tip>}
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} danger title={`Xóa ${deleteLabel}?`} confirmLabel="Xóa" onConfirm={() => { onDelete(); setConfirming(false) }} />
    </div>
  )
}

/** Hộp thoại thêm và sửa dùng chung. onSubmit nhận từ handleSubmit của React Hook Form. */
export function FormDialog({ open, onOpenChange, title, onSubmit, pending, submitLabel = 'Lưu', className, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className={className}>
        <form onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">{children}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" loading={pending}>{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
