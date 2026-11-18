import { CheckCheck, GlassWater, Hand, ReceiptText, Utensils, UtensilsCrossed } from 'lucide-react'
import { DishPhoto, ItemProgress, Money, QtyStepper } from '@/components/brand'
import { EmptyState } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'
import { REQUEST_TYPE } from '@/constants'

/** Món đã gọi của cả bàn và tạm tính. */
export function OrderTab({ sent, items, onRequestBill, billRequested, pending }) {
  const live = sent.filter((l) => l.status !== 'CANCELLED')
  const total = live.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  if (!sent.length) return <EmptyState icon={UtensilsCrossed} title="Bàn chưa gọi món" className="py-24" />
  return (
    <div className="p-4">
      <h2 className="text-s2 font-bold text-ink">Đơn của bàn</h2>
      <ul className="mt-3 list-none space-y-3 p-0">
        {sent.map((l) => (
          <li key={l.id} className="flex gap-3">
            <DishPhoto src={items[l.itemId]?.image} alt="" className="size-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 flex justify-between gap-2 text-s4"><span className={l.status === 'CANCELLED' ? 'text-ink-soft line-through' : 'font-semibold text-ink'}>{l.qty} × {items[l.itemId]?.name}</span><Money value={l.qty * l.unitPrice} className="font-medium text-ink" /></p>
              <ItemProgress status={l.status} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 rounded-panel bg-brand-50 p-4">
        <div className="flex items-baseline justify-between"><span className="text-s4 text-ink-soft">Tạm tính</span><Money value={total} className="text-s1 font-extrabold text-brand-800" /></div>
        <Button size="lg" variant={billRequested ? 'secondary' : 'primary'} className="mt-3 w-full" disabled={billRequested} loading={pending} onClick={onRequestBill}><ReceiptText size={18} aria-hidden="true" />{billRequested ? 'Đã báo thanh toán' : 'Yêu cầu thanh toán'}</Button>
      </div>
    </div>
  )
}

const HELP = [['CALL_STAFF', Hand], ['EXTRA_WATER', GlassWater], ['EXTRA_UTENSIL', Utensils], ['REQUEST_BILL', ReceiptText]]
const STATE = { OPEN: ['Đã gửi', 'solid'], ACKNOWLEDGED: ['Nhân viên đang đến', 'soft'], DONE: ['Xong', 'mute'] }

export function HelpTab({ requests, onAsk, pending }) {
  const openTypes = requests.filter((r) => r.status !== 'DONE').map((r) => r.type)
  return (
    <div className="p-4">
      <h2 className="text-s2 font-bold text-ink">Gọi nhân viên</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {HELP.map(([type, Icon]) => {
          const sent = openTypes.includes(type)
          return (
            <button key={type} type="button" disabled={sent || pending} onClick={() => onAsk(type)} className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-site bg-brand-50 text-s3 font-semibold text-brand-900 transition active:scale-[.98] enabled:hover:bg-brand-100 disabled:cursor-default disabled:bg-brand-700 disabled:text-white focus-visible:outline-2 focus-visible:outline-brand-700">
              {sent ? <CheckCheck size={26} aria-hidden="true" /> : <Icon size={26} className="text-brand-700" aria-hidden="true" />}
              {REQUEST_TYPE[type]}
            </button>
          )
        })}
      </div>
      {requests.length > 0 && (
        <ul className="mt-5 list-none divide-y divide-brand-100 p-0">
          {requests.map((r) => <li key={r.id} className="flex items-center justify-between py-2.5 text-s4 text-ink">{REQUEST_TYPE[r.type]}<Badge tone={STATE[r.status][1]}>{STATE[r.status][0]}</Badge></li>)}
        </ul>
      )}
    </div>
  )
}

/** Giỏ trên thiết bị này, gửi một lần cho cả giỏ. */
export function CartDrawer({ open, onOpenChange, cart, items, total, onPatch, onSend, pending }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent title="Giỏ của bạn" className="font-sans">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3">
          {!cart.length && <p className="py-10 text-center text-s4 text-ink-soft">Giỏ đang trống</p>}
          {cart.map((l) => (
            <div key={l.key} className="space-y-2">
              <div className="flex items-center gap-3">
                <DishPhoto src={items[l.itemId].image} alt="" className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1"><p className="truncate text-s3 font-semibold text-ink">{items[l.itemId].name}</p><Money value={items[l.itemId].price} className="text-s5 text-brand-700" /></div>
                <QtyStepper value={l.qty} onChange={(qty) => onPatch(l.key, { qty })} label={items[l.itemId].name} />
              </div>
              <Input value={l.note} maxLength={100} onChange={(e) => onPatch(l.key, { note: e.target.value })} placeholder="Ghi chú cho bếp" aria-label={`Ghi chú ${items[l.itemId].name}`} className="h-9 border-transparent bg-brand-50 text-s5" />
            </div>
          ))}
        </div>
        {cart.length > 0 && <div className="shrink-0 border-t border-brand-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button size="lg" className="w-full" loading={pending} onClick={onSend}>Gửi món · <Money value={total} /></Button></div>}
      </DrawerContent>
    </Drawer>
  )
}
