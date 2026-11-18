import { TableShape } from '@/components/brand/TableShape'
import { TABLE_STATUS } from '@/constants'
import { cn } from '@/utils/cn'
import { money } from '@/utils/format'

const ZONE = {
  HALL: 'border-brand-200 bg-white',
  BAR: 'border-brand-200 bg-white',
  OUTDOOR: 'border-dashed border-brand-300 bg-brand-50',
  VIP_ROOM: 'border-2 border-brand-300 bg-white',
}

/** Mặt bằng một tầng. info(t) trả { line2, alert, dim }. */
export default function FloorMap({ areas, tables, selectedId, onSelect, info }) {
  return (
    <div className="flex flex-wrap content-start gap-4">
      {areas.map((a) => {
        const list = tables.filter((t) => t.areaId === a.id)
        const free = list.filter((t) => t.status === 'AVAILABLE').length
        return (
          <section key={a.id} aria-label={a.name} className={cn('relative shrink-0 rounded-site border', ZONE[a.type])} style={{ width: a.planW, height: a.planH }}>
            <h2 className="absolute top-3 left-4 flex items-baseline gap-2 text-s5 font-bold text-ink">
              {a.name}
              <span className="font-medium text-ink-soft tabular-nums">Trống {free}/{list.length}</span>
            </h2>
            {a.minSpend > 0 && <p className="absolute top-3 right-4 text-s6 font-medium text-brand-800">Tối thiểu {money(a.minSpend)} · phí {a.serviceFeePercent}%</p>}
            {a.type === 'BAR' && <div aria-hidden="true" className="absolute top-10 right-4 bottom-4 w-9 rounded-lg bg-brand-100" />}
            {list.map((t) => {
              const x = info(t)
              return <TableShape key={t.id} table={t} selected={t.id === selectedId} dim={x.dim} alert={x.alert} line2={x.line2} onClick={() => onSelect(t.id)} style={{ left: t.posX, top: t.posY }} label={`Bàn ${t.code}, ${t.seats} chỗ, ${TABLE_STATUS[t.status][0]}`} />
            })}
          </section>
        )
      })}
    </div>
  )
}
