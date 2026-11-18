import { ImageOff, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { money } from '@/utils/format'
import { Badge } from '@/components/ui/feedback'

const ANGLES = [0, 60, 120]

export function Logo({ tone = 'brand', compact, className }) {
  const white = tone === 'white'
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-extrabold tracking-tight', white ? 'text-white' : 'text-ink', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill={white ? 'var(--color-white)' : 'var(--color-brand-600)'} />
        <circle cx="16" cy="16" r="11.5" fill={white ? 'var(--color-brand-100)' : 'var(--color-brand-300)'} />
        {ANGLES.map((a) => <rect key={a} x="15.2" y="4.5" width="1.6" height="23" fill={white ? 'var(--color-white)' : 'var(--color-brand-600)'} transform={`rotate(${a} 16 16)`} />)}
      </svg>
      {!compact && <span className="text-s2">Nhà Hàng Cam</span>}
    </span>
  )
}

export function Money({ value, className }) {
  return <span className={cn('font-semibold tabular-nums', className)}>{money(value)}</span>
}

export function DishPhoto({ src, alt = '', className, imgClassName, loading = 'lazy' }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className={cn('relative overflow-hidden bg-brand-100', className)}>
      {src && !broken
        ? <img src={src} alt={alt} loading={loading} onError={() => setBroken(true)} className={cn('block size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]', imgClassName)} />
        : <div className="flex size-full items-center justify-center text-brand-400"><ImageOff size={24} aria-hidden="true" /></div>}
    </div>
  )
}

const STEPS = ['PENDING', 'COOKING', 'READY', 'SERVED']
const STEP_LABEL = { PENDING: 'Chờ bếp', COOKING: 'Đang nấu', READY: 'Sẵn sàng', SERVED: 'Đã mang ra', CANCELLED: 'Đã hủy' }

/** Tiến độ món: 4 đoạn cam thay cho nhiều màu trạng thái. */
export function ItemProgress({ status, className }) {
  const at = STEPS.indexOf(status)
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-1" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s} className={cn('h-1.5 flex-1 rounded-full', status === 'CANCELLED' ? 'bg-mute' : i <= at ? 'bg-brand-600' : 'bg-brand-100')} />)}
      </div>
      <p className={cn('text-s6 font-medium', status === 'CANCELLED' ? 'text-ink-soft' : 'text-brand-800')}>{STEP_LABEL[status]}</p>
    </div>
  )
}

const TONE_BY_COLOR = { gold: 'solid', orange: 'solid', blue: 'soft', green: 'outline', default: 'mute', red: 'mute', volcano: 'mute' }

/** Nhãn trạng thái một màu. map là bảng trong constants.js: { GIÁ_TRỊ: [nhãn, màu cũ] }. */
export function StatusPill({ map, value, tone, className }) {
  const [label, color] = map[value] ?? [value, 'default']
  return <Badge tone={tone ?? TONE_BY_COLOR[color]} className={className}>{label}</Badge>
}

const stepBtn = 'flex size-9 cursor-pointer items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700'

/** Số lượng 0 chỉ hiện nút cộng. */
export function QtyStepper({ value, onChange, label = '', disabled, min = 0 }) {
  if (value <= 0) {
    return <button type="button" disabled={disabled} aria-label={`Thêm ${label}`} onClick={() => onChange(1)} className={cn(stepBtn, 'bg-brand-700 text-white hover:bg-brand-800 disabled:pointer-events-none disabled:bg-mute disabled:text-ink-soft')}><Plus size={18} aria-hidden="true" /></button>
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-brand-100 p-0.5">
      <button type="button" disabled={value <= min} aria-label={`Bớt ${label}`} onClick={() => onChange(value - 1)} className={cn(stepBtn, 'size-8 bg-white text-brand-800 disabled:opacity-40')}><Minus size={16} aria-hidden="true" /></button>
      <span key={value} className="w-6 animate-pop text-center text-s4 font-bold text-brand-900 tabular-nums">{value}</span>
      <button type="button" aria-label={`Thêm ${label}`} onClick={() => onChange(value + 1)} className={cn(stepBtn, 'size-8 bg-brand-700 text-white hover:bg-brand-800')}><Plus size={16} aria-hidden="true" /></button>
    </div>
  )
}
