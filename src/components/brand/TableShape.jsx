import { useId } from 'react'
import { cn } from '@/utils/cn'
import { chairsFor, TABLE_INSET, tableBox } from '@/utils/floor'

const v = (name) => `var(--color-${name})`

// Trạng thái phân biệt bằng độ đậm, viền và hoa văn, không thêm màu (plan mục 4.3).
const TONES = {
  AVAILABLE: { top: v('white'), stroke: v('brand-300'), chair: v('brand-200'), text: 'text-ink', sub: 'text-ink-soft' },
  RESERVED: { top: v('brand-200'), stroke: v('brand-700'), dash: '6 4', chair: v('brand-300'), text: 'text-brand-900', sub: 'text-brand-900' },
  OCCUPIED: { top: v('brand-700'), stroke: v('brand-800'), chair: v('brand-800'), text: 'text-white', sub: 'text-white' },
  CLEANING: { stripes: true, stroke: v('brand-300'), chair: v('brand-200'), text: 'text-brand-900', sub: 'text-brand-900' },
  DISABLED: { top: v('mute'), stroke: v('mute'), chair: v('mute'), text: 'text-ink-soft', sub: 'text-ink-soft' },
}

/** Mặt bàn và ghế vẽ theo số chỗ. Bấm được; line2 là dòng phụ dưới mã bàn. */
export function TableShape({ table, status = table.status, selected, dim, alert, line2, onClick, style, className, label }) {
  const uid = useId()
  const tone = TONES[status] ?? TONES.AVAILABLE
  const box = tableBox(table)
  const { w, h } = box
  const round = table.shape === 'ROUND'
  const top = tone.stripes ? `url(#${uid})` : tone.top
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={selected} style={{ width: w, height: h, ...style }}
      className={cn('group absolute cursor-pointer rounded-2xl transition duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700', dim && 'opacity-25', selected && 'z-10', className)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="absolute inset-0 block">
        <defs>
          <pattern id={uid} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill={v('white')} />
            <rect width="5" height="10" fill={v('brand-100')} />
          </pattern>
        </defs>
        {chairsFor(table, box).map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={c.rx} fill={tone.chair} transform={c.rotate === undefined ? undefined : `rotate(${c.rotate} ${c.cx} ${c.cy})`} />
        ))}
        {round
          ? <circle cx={w / 2} cy={h / 2} r={w / 2 - TABLE_INSET + 2} fill={top} stroke={selected ? v('brand-900') : tone.stroke} strokeWidth={selected ? 3 : 1.5} strokeDasharray={selected ? undefined : tone.dash} />
          : <rect x={TABLE_INSET - 2} y={TABLE_INSET - 2} width={w - 2 * TABLE_INSET + 4} height={h - 2 * TABLE_INSET + 4} rx="12" fill={top} stroke={selected ? v('brand-900') : tone.stroke} strokeWidth={selected ? 3 : 1.5} strokeDasharray={selected ? undefined : tone.dash} />}
      </svg>
      <span className={cn('absolute inset-0 flex flex-col items-center justify-center leading-tight', tone.text)}>
        <span className="text-s5 font-bold tabular-nums">{table.code}</span>
        {line2 && <span className={cn('text-s6 font-medium tabular-nums', tone.sub)}>{line2}</span>}
      </span>
      {alert && (
        <span className="absolute top-3 right-3 flex size-3" aria-hidden="true">
          <span className="absolute inset-0 animate-ring-dot rounded-full bg-brand-500" />
          <span className="relative size-3 rounded-full border-2 border-white bg-brand-900" />
        </span>
      )}
    </button>
  )
}
