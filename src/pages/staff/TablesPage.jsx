import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Sheet, SheetContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageLoader } from '@/components/data/EmptyState'
import { useCol } from '@/hooks/useApi'
import { REQUEST_TYPE, SEAT_FILTERS, seatBucket, TABLE_STATUS } from '@/constants'
import { cn } from '@/utils/cn'
import { dayjs, fmtTime, matches, minutesSince } from '@/utils/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import FloorMap from '@/pages/staff/components/FloorMap'
import TablePanel from '@/pages/staff/components/TablePanel'

const SWATCH = {
  AVAILABLE: 'border border-brand-300 bg-white',
  RESERVED: 'border border-dashed border-brand-700 bg-brand-200',
  OCCUPIED: 'bg-brand-700',
  CLEANING: 'border border-brand-300 bg-[repeating-linear-gradient(45deg,var(--color-brand-100)_0_3px,white_3px_6px)]',
}
const SEAT_OPTIONS = [{ value: 'all', label: 'Mọi số chỗ' }, ...SEAT_FILTERS.map(([value, label]) => ({ value, label }))]

export default function TablesPage() {
  const { data: floors } = useCol('floors')
  const { data: areas } = useCol('areas')
  const { data: tables, isLoading } = useCol('tables')
  const { data: orders } = useCol('orders')
  const { data: reqs } = useCol('serviceRequests')
  const { data: reservations } = useCol('reservations')
  const wide = useMediaQuery('(min-width: 1280px)')
  // Bộ lọc nằm trên URL: tải lại hoặc gửi link vẫn giữ nguyên (plan mục 3.3).
  const [sp, setSp] = useSearchParams()
  const set = (patch) => setSp((p) => { Object.entries(patch).forEach(([k, v]) => { if (v === null || v === undefined || v === '') p.delete(k); else p.set(k, v) }); return p }, { replace: true })

  if (isLoading) return <PageLoader className="min-h-full" />

  const selected = tables.find((t) => t.id === Number(sp.get('table')))
  const activeFloors = floors.filter((f) => f.isActive).sort((a, b) => a.level - b.level)
  const areaOf = (t) => areas.find((a) => a.id === t.areaId)
  const floorId = Number(sp.get('floor')) || (selected && areaOf(selected)?.floorId) || activeFloors[0]?.id
  const floorAreas = areas.filter((a) => a.floorId === floorId && a.isActive)
  const usable = tables.filter((t) => t.isActive)
  const floorTables = usable.filter((t) => floorAreas.some((a) => a.id === t.areaId))
  const status = sp.get('status'), seats = sp.get('seats'), q = sp.get('q') ?? ''

  const todayRes = reservations.filter((r) => ['PENDING', 'CONFIRMED'].includes(r.status) && dayjs(r.time).isSame(dayjs(), 'day') && dayjs(r.time).isAfter(dayjs().subtract(30, 'minute'))).sort((a, b) => a.time.localeCompare(b.time))
  const openReqs = reqs.filter((r) => r.status !== 'DONE')

  const info = (t) => {
    const o = orders.find((x) => x.tableId === t.id && x.status === 'OPEN')
    const res = t.status === 'RESERVED' && todayRes.find((r) => r.tableIds.includes(t.id))
    return {
      line2: o ? `${minutesSince(o.openedAt)}'` : res ? fmtTime(res.time) : `${t.seats} chỗ`,
      alert: openReqs.some((r) => r.tableId === t.id),
      dim: (status && t.status !== status) || (seats && seatBucket(t.seats) !== Number(seats)) || (q && !matches(q, t.code)),
    }
  }

  const panel = selected && <TablePanel key={selected.id} table={selected} onClose={wide ? () => set({ table: null }) : undefined} />

  return (
    <div className="flex h-full min-w-0 font-sans">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-brand-100 bg-white px-4 py-3 lg:px-6">
          <div role="tablist" aria-label="Tầng" className="flex gap-1 rounded-control bg-brand-100 p-1">
            {activeFloors.map((f) => {
              const ts = usable.filter((t) => areaOf(t)?.floorId === f.id)
              const on = f.id === floorId
              return (
                <button key={f.id} type="button" role="tab" aria-selected={on} onClick={() => set({ floor: f.id })} className={cn('cursor-pointer rounded-lg px-3 py-1.5 text-s5 font-semibold transition focus-visible:outline-2 focus-visible:outline-brand-700', on ? 'bg-white text-brand-700 shadow-soft' : 'text-brand-800 hover:bg-brand-200/60')}>
                  {f.name}<span className="ml-1.5 font-medium tabular-nums">{ts.filter((t) => t.status === 'AVAILABLE').length}/{ts.length}</span>
                </button>
              )
            })}
          </div>
          <div className="order-last flex w-full flex-wrap gap-1.5">
            {Object.keys(SWATCH).map((s) => {
              const on = status === s
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => set({ status: on ? null : s })} className={cn('flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-s5 font-medium transition focus-visible:outline-2 focus-visible:outline-brand-700', on ? 'border-brand-700 bg-brand-100 text-brand-900' : 'border-transparent text-ink hover:bg-brand-50')}>
                  <span aria-hidden="true" className={cn('size-3.5 rounded', SWATCH[s])} />{TABLE_STATUS[s][0]}<span className="text-ink-soft tabular-nums">{floorTables.filter((t) => t.status === s).length}</span>
                </button>
              )
            })}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select aria-label="Số chỗ" className="h-9 w-32 text-s5" value={seats ? Number(seats) : 'all'} onValueChange={(v) => set({ seats: v === 'all' ? null : v })} options={SEAT_OPTIONS} />
            <div className="relative w-32">
              <Search size={15} className="absolute top-2.5 left-2.5 text-brand-700" aria-hidden="true" />
              <Input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Mã bàn" aria-label="Tìm mã bàn" className="h-9 pl-8 text-s5" />
            </div>
          </div>
        </div>
        <div className="dot-grid min-h-0 flex-1 overflow-auto bg-brand-50 p-4 lg:p-6">
          <FloorMap areas={floorAreas} tables={floorTables} selectedId={selected?.id} onSelect={(id) => set({ table: id, floor: floorId })} info={info} />
        </div>
      </div>

      {wide && (
        <aside className="w-80 shrink-0 border-l border-brand-100 2xl:w-96">
          {panel || <TodayPanel reservations={todayRes} requests={openReqs} tables={tables} onPick={(id) => set({ table: id, floor: areaOf(tables.find((t) => t.id === id))?.floorId })} />}
        </aside>
      )}
      {!wide && (
        <Sheet open={!!selected} onOpenChange={(o) => { if (!o) set({ table: null }) }}>
          <SheetContent title={selected ? `Bàn ${selected.code}` : 'Bàn'} hideHeader>{panel}</SheetContent>
        </Sheet>
      )}
    </div>
  )
}

function TodayPanel({ reservations, requests, tables, onPick }) {
  const code = (id) => tables.find((t) => t.id === id)?.code
  const row = 'flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-left transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700'
  return (
    <div className="h-full space-y-6 overflow-y-auto p-5">
      <section>
        <h2 className="mb-2 flex items-baseline justify-between text-s3 font-bold text-ink">Yêu cầu của khách<span className="text-s5 font-medium text-ink-soft tabular-nums">{requests.length}</span></h2>
        {!requests.length && <p className="rounded-panel bg-brand-50 p-4 text-center text-s4 text-ink-soft">Không có yêu cầu</p>}
        <div className="-mx-3">
          {requests.map((r) => (
            <button key={r.id} type="button" className={row} onClick={() => onPick(r.tableId)}>
              <span className="flex h-9 min-w-12 items-center justify-center rounded-lg bg-brand-700 px-2 text-s5 font-bold text-white tabular-nums">{code(r.tableId)}</span>
              <span className="flex-1 text-s4 font-medium text-ink">{REQUEST_TYPE[r.type]}</span>
              <span className="text-s5 text-ink-soft tabular-nums">{minutesSince(r.createdAt)}'</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 flex items-baseline justify-between text-s3 font-bold text-ink">Lượt đặt hôm nay<span className="text-s5 font-medium text-ink-soft tabular-nums">{reservations.length}</span></h2>
        {!reservations.length && <p className="rounded-panel bg-brand-50 p-4 text-center text-s4 text-ink-soft">Không còn lượt đặt</p>}
        <div className="-mx-3">
          {reservations.map((r) => (
            <button key={r.id} type="button" className={row} onClick={() => r.tableIds[0] && onPick(r.tableIds[0])}>
              <span className="flex h-9 min-w-12 items-center justify-center rounded-lg bg-brand-200 px-2 text-s5 font-bold text-brand-900 tabular-nums">{fmtTime(r.time)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-s4 font-medium text-ink">{r.guestName}</span><span className="block text-s5 text-ink-soft tabular-nums">{r.guestCount} khách · {r.tableIds.map(code).join(', ')}</span></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
