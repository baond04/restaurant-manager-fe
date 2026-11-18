import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

/** Chọn bàn trống đủ chỗ để chuyển sang, xếp theo khu vực. */
export default function MoveTableDialog({ open, onOpenChange, table, guestCount, tables, areas, pending, onMove }) {
  const [to, setTo] = useState(null)
  const can = tables.filter((t) => t.isActive && t.status === 'AVAILABLE' && t.seats >= guestCount)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Chuyển bàn ${table.code} sang`} className="font-sans">
        <div className="space-y-4">
          {!can.length && <p className="py-6 text-center text-s4 text-ink-soft">Không có bàn trống đủ {guestCount} chỗ</p>}
          {areas.filter((a) => can.some((t) => t.areaId === a.id)).map((a) => (
            <div key={a.id}>
              <p className="mb-2 text-s5 font-semibold text-ink-soft">{a.name}</p>
              <div className="flex flex-wrap gap-2">
                {can.filter((t) => t.areaId === a.id).map((t) => (
                  <button key={t.id} type="button" aria-pressed={to === t.id} onClick={() => setTo(t.id)} className={cn('h-12 min-w-16 cursor-pointer rounded-control border px-3 text-s4 font-bold tabular-nums transition', to === t.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-ink hover:bg-brand-50')}>
                    {t.code}<span className={cn('block text-s6 font-medium', to === t.id ? 'text-white' : 'text-ink-soft')}>{t.seats} chỗ</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={!to} loading={pending} onClick={() => onMove(to)}>Chuyển</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
