import { Star } from 'lucide-react'
import { useState } from 'react'
import { DishPhoto, Money, QtyStepper } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/feedback'
import { Textarea } from '@/components/ui/input'
import { byId, useCol } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function Body({ item, onAdd, children }) {
  const { data: reviews } = useCol('reviews')
  const tags = byId(useCol('tags').data)
  const users = byId(useCol('users').data)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const rs = reviews.filter((r) => r.itemId === item.id && !r.hidden)
  const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <DishPhoto src={item.image} alt={item.name} loading="eager" className="aspect-[16/10] w-full" />
        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-d4 font-bold text-ink">{item.name}</h2>
            <p className="mt-1 text-s3 text-ink-soft">{item.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.tagIds.map((t) => <Badge key={t}>{tags[t]?.name}</Badge>)}
            {rs.length > 0 && <Badge tone="outline"><Star size={12} className="fill-current" aria-hidden="true" />{avg.toFixed(1)} · {rs.length} đánh giá</Badge>}
          </div>
          {onAdd && <Textarea rows={2} maxLength={100} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho bếp" aria-label="Ghi chú cho bếp" />}
          {rs.slice(0, 3).map((r) => (
            <div key={r.id} className="border-t border-brand-100 pt-3 text-s4">
              <p className="font-semibold text-ink">{users[r.customerId]?.fullName}</p>
              <p className="text-ink-soft">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-brand-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {onAdd ? (
          <>
            <QtyStepper value={qty} min={1} onChange={setQty} label={item.name} />
            <Button size="lg" className="flex-1" disabled={!item.isAvailable} onClick={() => onAdd(item, qty, note)}>{item.isAvailable ? <>Thêm · <Money value={item.price * qty} /></> : 'Hết món'}</Button>
          </>
        ) : children ?? <Money value={item.price} className="text-d4 text-brand-700" />}
      </div>
    </>
  )
}

/** Chi tiết món: ngăn kéo dưới trên điện thoại, hộp thoại trên máy tính. onAdd(item, qty, note) bật nút thêm. */
export default function ItemDetail({ item, onClose, onAdd, children }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const change = (o) => { if (!o) onClose() }
  if (desktop) {
    return (
      <Dialog open={!!item} onOpenChange={change}>
        <DialogContent bare title={item?.name ?? 'Chi tiết món'} className="max-w-xl font-sans">
          {item && <div className="flex max-h-[90dvh] flex-col"><Body key={item.id} item={item} onAdd={onAdd}>{children}</Body></div>}
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Drawer open={!!item} onOpenChange={change}>
      <DrawerContent hideHeader title={item?.name ?? 'Chi tiết món'} className="font-sans">
        {item && <Body key={item.id} item={item} onAdd={onAdd}>{children}</Body>}
      </DrawerContent>
    </Drawer>
  )
}
