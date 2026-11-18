import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DishPhoto, Money, QtyStepper } from '@/components/brand'
import { Badge } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { matches } from '@/utils/format'

/** Thực đơn tại bàn. canOrder = false thì chỉ xem. */
export default function MenuList({ items, categories, popular, qtyOf, setQty, canOrder, onOpen }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(categories[0]?.id)
  const sections = useRef({})
  const shown = items.filter((i) => matches(q, i.name, i.description))
  const cats = categories.filter((c) => shown.some((i) => i.categoryId === c.id))

  // Đánh dấu danh mục đang xem khi cuộn.
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.cat)) }), { rootMargin: '-120px 0px -70% 0px' })
    Object.values(sections.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [cats.length])

  const go = (id) => window.scrollTo({ top: sections.current[id].getBoundingClientRect().top + window.scrollY - 116, behavior: 'smooth' })

  return (
    <>
      {!q && popular.length > 0 && (
        <section className="pt-4">
          <h2 className="px-4 text-s2 font-bold text-ink">Được gọi nhiều</h2>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
            {popular.map((it) => (
              <div key={it.id} className="relative w-36 shrink-0">
                <button type="button" onClick={() => onOpen(it)} className="group block w-full cursor-pointer text-left">
                  <DishPhoto src={it.image} alt="" className="aspect-square rounded-2xl" />
                  <span className="mt-1.5 block truncate text-s4 font-semibold text-ink">{it.name}</span>
                  <Money value={it.price} className="text-s5 text-brand-700" />
                </button>
                {canOrder && <div className="absolute top-2 right-2"><QtyStepper value={qtyOf(it)} onChange={(n) => setQty(it, n)} label={it.name} /></div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sticky top-[60px] z-20 mt-4 border-b border-brand-100 bg-white">
        <div className="relative px-4 pt-1">
          <Search size={16} className="absolute top-4 left-7 text-brand-700" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm món" aria-label="Tìm món" className="h-10 border-transparent bg-brand-50 pl-9" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5">
          {cats.map((c) => (
            <button key={c.id} type="button" onClick={() => go(c.id)} aria-current={active === c.id} className={cn('h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-s5 font-semibold transition', active === c.id ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-800')}>{c.name}</button>
          ))}
        </div>
      </div>

      {cats.map((c) => (
        <section key={c.id} data-cat={c.id} ref={(el) => { sections.current[c.id] = el }}>
          <h2 className="px-4 pt-5 pb-1 text-s2 font-bold text-ink">{c.name}</h2>
          {shown.filter((i) => i.categoryId === c.id).map((it) => (
            <div key={it.id} className="flex gap-3 border-b border-brand-50 px-4 py-3 last:border-0">
              <button type="button" onClick={() => onOpen(it)} className="group flex min-w-0 flex-1 cursor-pointer gap-3 text-left">
                <DishPhoto src={it.image} alt="" className={cn('size-22 shrink-0 rounded-2xl', !it.isAvailable && 'opacity-50')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-s3 font-semibold text-ink">{it.name}</span>
                  <span className="mt-0.5 line-clamp-2 text-s5 text-ink-soft">{it.description}</span>
                  <Money value={it.price} className="mt-1 block text-s4 text-brand-700" />
                </span>
              </button>
              <div className="flex items-end">
                {!it.isAvailable ? <Badge tone="mute">Hết món</Badge> : canOrder && <QtyStepper value={qtyOf(it)} onChange={(n) => setQty(it, n)} label={it.name} />}
              </div>
            </div>
          ))}
        </section>
      ))}
      {!cats.length && <p className="px-4 py-12 text-center text-s4 text-ink-soft">Không có món phù hợp</p>}
    </>
  )
}
