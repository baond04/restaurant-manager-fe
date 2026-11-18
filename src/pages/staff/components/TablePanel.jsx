import { BellRing, ExternalLink, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ItemProgress, Money, QtyStepper, StatusPill } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { REQUEST_TYPE, TABLE_STATUS } from '@/constants'
import { fmtTime, minutesSince } from '@/utils/format'
import MoveTableDialog from '@/pages/staff/components/MoveTableDialog'

const PILL = { AVAILABLE: 'outline', RESERVED: 'soft', OCCUPIED: 'solid', CLEANING: 'soft', DISABLED: 'mute' }
const Stat = ({ k, v }) => <div><dt className="text-s6 text-ink-soft">{k}</dt><dd className="text-s3 font-semibold text-ink tabular-nums">{v}</dd></div>

/** Chi tiết một bàn: thông tin, yêu cầu, món đã gọi và thao tác. */
export default function TablePanel({ table: t, onClose }) {
  const { user, can } = useStaff()
  const run = useRun()
  const nav = useNavigate()
  const { data: tables } = useCol('tables')
  const { data: areas } = useCol('areas')
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const { data: reqs } = useCol('serviceRequests')
  const items = byId(useCol('items').data)
  const [guests, setGuests] = useState(2)
  const [moving, setMoving] = useState(false)

  const area = areas.find((a) => a.id === t.areaId)
  const o = orders.find((x) => x.tableId === t.id && x.status === 'OPEN')
  const ol = o ? lines.filter((l) => l.orderId === o.id) : []
  const live = ol.filter((l) => l.status !== 'CANCELLED')
  const total = live.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const tReqs = reqs.filter((r) => r.tableId === t.id && r.status !== 'DONE')
  const url = `${window.location.origin}/t/${t.qrToken}`

  return (
    <div className="flex h-full flex-col bg-white font-sans">
      <div className="shrink-0 bg-brand-50 px-5 pt-4 pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-s1 font-extrabold text-ink tabular-nums">Bàn {t.code}</h2>
          <StatusPill map={TABLE_STATUS} value={t.status} tone={PILL[t.status]} />
          {onClose && <Button variant="ghost" size="icon-sm" aria-label="Bỏ chọn bàn" className="ml-auto" onClick={onClose}><X size={18} aria-hidden="true" /></Button>}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          <Stat k="Khu vực" v={area?.name} />
          <Stat k="Số chỗ" v={t.seats} />
          {o ? <Stat k="Đã ngồi" v={`${minutesSince(o.openedAt)} phút`} /> : <Stat k="QR" v={<QrPopover url={url} token={t.qrToken} />} />}
        </dl>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {tReqs.map((r) => (
          <div key={r.id} className="flex items-center gap-3 rounded-panel bg-brand-700 p-3 text-white">
            <BellRing size={18} aria-hidden="true" />
            <span className="flex-1 text-s4 font-semibold">{REQUEST_TYPE[r.type]}<span className="ml-2 font-normal tabular-nums">{fmtTime(r.createdAt)}</span></span>
            {can('request:handle') && <Button variant="inverse" size="sm" onClick={() => run(() => (r.status === 'OPEN' ? api.ackRequest(r.id, user.id) : api.doneRequest(r.id, user.id)), r.status === 'OPEN' ? 'Đã nhận' : 'Đã xong')}>{r.status === 'OPEN' ? 'Nhận' : 'Xong'}</Button>}
          </div>
        ))}

        {o && (
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-s3 font-bold text-ink">Món đã gọi</h3>
              <span className="text-s5 text-ink-soft tabular-nums">{o.guestCount} khách · vào {fmtTime(o.openedAt)}</span>
            </div>
            {!ol.length && <p className="rounded-panel bg-brand-50 p-4 text-center text-s4 text-ink-soft">Chưa gọi món</p>}
            <ul className="list-none space-y-3 p-0">
              {ol.map((l) => (
                <li key={l.id}>
                  <p className="mb-1 flex justify-between gap-3 text-s4 text-ink"><span className={l.status === 'CANCELLED' ? 'text-ink-soft line-through' : 'font-medium'}>{l.qty} × {items[l.itemId]?.name}</span><Money value={l.qty * l.unitPrice} className="font-medium" /></p>
                  {l.note && <p className="mb-1 text-s5 text-ink-soft">{l.note}</p>}
                  <ItemProgress status={l.status} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {t.status === 'AVAILABLE' && can('table:operate') && (
          <section className="rounded-panel bg-brand-50 p-4">
            <div className="flex items-center justify-between"><span className="text-s3 font-bold text-ink">Số khách</span><QtyStepper value={guests} min={1} onChange={(g) => setGuests(Math.min(g, t.seats + 4))} label="khách" /></div>
          </section>
        )}
      </div>

      <div className="shrink-0 space-y-2 border-t border-brand-100 p-4">
        {o && <div className="flex items-baseline justify-between pb-1"><span className="text-s4 text-ink-soft">Tạm tính</span><Money value={total} className="text-s1 font-extrabold text-brand-800" /></div>}
        {t.status === 'AVAILABLE' && can('table:operate') && <Button size="lg" className="w-full" loading={run.pending} onClick={() => run(() => api.openTable(t.id, { guestCount: guests, openedBy: user.id }), `Đã mở bàn ${t.code}`)}>Mở bàn</Button>}
        {o && (
          <div className="grid grid-cols-2 gap-2">
            {can('order:create') && <Button size="lg" onClick={() => nav(`/staff/pos?table=${t.id}`)}>Gọi thêm</Button>}
            {can('bill:pay') && <Button size="lg" variant="secondary" onClick={() => nav(`/staff/bills?pay=${o.id}`)}>Thanh toán</Button>}
          </div>
        )}
        <div className="flex flex-wrap gap-2 [&>*]:flex-1">
          {o && can('table:operate') && <Button variant="outline" onClick={() => setMoving(true)}>Chuyển bàn</Button>}
          {o && can('table:operate') && ol.every((l) => l.status === 'CANCELLED') && <Button variant="outline" className="text-danger" onClick={() => run(() => api.cancelOrder(o.id), `Đã hủy mở bàn ${t.code}`)}>Hủy mở bàn</Button>}
          {['CLEANING', 'RESERVED'].includes(t.status) && can('table:operate') && <Button size="lg" onClick={() => run(() => api.setTableStatus(t.id, 'AVAILABLE'), `Bàn ${t.code} đã trống`)}>{t.status === 'CLEANING' ? 'Dọn xong' : 'Bỏ giữ bàn'}</Button>}
          {o && <QrPopover url={url} token={t.qrToken} button />}
        </div>
      </div>

      {moving && <MoveTableDialog open onOpenChange={setMoving} table={t} guestCount={o?.guestCount ?? 1} tables={tables} areas={areas} pending={run.pending} onMove={(to) => run(() => api.moveTable(o.id, to), 'Đã chuyển bàn').then(() => { setMoving(false); onClose?.() })} />}
    </div>
  )
}

function QrPopover({ url, token, button }) {
  return (
    <Popover>
      {button
        ? <PopoverTrigger asChild><Button variant="outline" size="icon" aria-label="Mã QR của bàn" className="max-w-10"><QrCode size={18} aria-hidden="true" /></Button></PopoverTrigger>
        : <PopoverTrigger className="flex cursor-pointer items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"><QrCode size={15} aria-hidden="true" />Xem</PopoverTrigger>}
      <PopoverContent align="end" className="w-52 text-center">
        <QRCodeSVG value={url} size={176} fgColor="#7c2d12" className="mx-auto" title="Mã QR của bàn" />
        <Link to={`/t/${token}`} target="_blank" className="mt-2 inline-flex items-center gap-1 text-s5 font-semibold text-brand-700"><ExternalLink size={14} aria-hidden="true" />Mở trang gọi món</Link>
      </PopoverContent>
    </Popover>
  )
}
