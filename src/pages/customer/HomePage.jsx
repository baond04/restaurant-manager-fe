import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { DishPhoto, Money } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { useCol } from '@/hooks/useApi'
import { useCustomer } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import BookingBar from '@/pages/customer/components/BookingBar'
import ItemDetail from '@/pages/customer/components/ItemDetail'

const wrap = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'
const HERO_PHOTO = '/img/boluclac.jpg'

export default function HomePage() {
  const me = useCustomer()
  const { data: items } = useCol('items')
  const { data: lines } = useCol('orderItems')
  const { data: orders } = useCol('orders')
  const [open, setOpen] = useState(null)

  const sold = new Map()
  lines.forEach((l) => sold.set(l.itemId, (sold.get(l.itemId) || 0) + l.qty))
  const usable = items.filter((i) => i.isAvailable && i.image && !i.tagIds.some((t) => me?.allergyTagIds?.includes(t)))
  const popular = usable.filter((i) => i.image !== HERO_PHOTO).sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0)).slice(0, 5)
  // shortcut: gợi ý cá nhân = món cùng danh mục với món khách gọi nhiều; bản thật lấy từ mô hình GNN+GCL.
  const orderIds = new Set(orders.filter((o) => o.customerId === me?.id).map((o) => o.id))
  const myCats = new Set(lines.filter((l) => orderIds.has(l.orderId)).map((l) => items.find((i) => i.id === l.itemId)?.categoryId))
  const forYou = me ? usable.filter((i) => myCats.has(i.categoryId) && !popular.includes(i)).slice(0, 8) : []

  return (
    <>
      <Hero />
      {forYou.length > 0 && (
        <section className={cn(wrap, 'pt-16')}>
          <h2 className="text-d3 font-extrabold text-ink">Gợi ý cho bạn</h2>
          <div className="no-scrollbar mt-5 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {forYou.map((it) => (
              <button key={it.id} type="button" onClick={() => setOpen(it)} className="group w-52 shrink-0 cursor-pointer text-left">
                <DishPhoto src={it.image} alt="" className="aspect-[4/3] rounded-site" />
                <p className="mt-2 truncate text-s3 font-semibold text-ink">{it.name}</p>
                <Money value={it.price} className="text-s4 text-brand-700" />
              </button>
            ))}
          </div>
        </section>
      )}
      <Popular items={popular} onOpen={setOpen} />
      <Spaces />
      <Visit />
      <ItemDetail item={open} onClose={() => setOpen(null)}>
        {open && <><Money value={open.price} className="text-d4 text-brand-700" /><Button asChild size="lg" className="ml-auto"><Link to="/booking">Đặt bàn</Link></Button></>}
      </ItemDetail>
    </>
  )
}

function Hero() {
  return (
    <section className="grid lg:min-h-[640px] lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-brand-700 px-4 py-12 text-white sm:px-6 lg:py-16 lg:pr-12 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        <p className="flex items-center gap-2 text-s3 font-medium"><Clock size={17} aria-hidden="true" />Mở cửa hằng ngày 10:00–22:00</p>
        <h1 className="mt-4 text-d2 font-extrabold tracking-tight text-balance lg:text-d1">Nhà hàng món Việt ở Thanh Xuân, Hà Nội</h1>
        <div className="mt-6"><Button asChild variant="inverse" size="lg"><Link to="/menu">Xem thực đơn<ArrowRight size={18} aria-hidden="true" /></Link></Button></div>
        <div className="mt-10 text-body"><BookingBar /></div>
      </div>
      <DishPhoto src={HERO_PHOTO} alt="Bò lúc lắc" loading="eager" className="h-64 sm:h-96 lg:h-auto" />
    </section>
  )
}

function Popular({ items, onOpen }) {
  return (
    <section className={cn(wrap, 'py-16 lg:py-20')}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-d3 font-extrabold text-ink lg:text-d2">Món được gọi nhiều</h2>
        <Link to="/menu" className="flex shrink-0 items-center gap-1 text-s3 font-semibold text-brand-700 hover:text-brand-800">Thực đơn<ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:h-[560px] lg:grid-cols-4 lg:grid-rows-2">
        {items.map((it, i) => (
          <button key={it.id} type="button" onClick={() => onOpen(it)} aria-label={it.name} className={cn('group relative cursor-pointer overflow-hidden rounded-site text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700', i === 0 ? 'col-span-2 aspect-[4/3] lg:row-span-2 lg:aspect-auto' : 'aspect-square lg:aspect-auto')}>
            <DishPhoto src={it.image} alt="" className="absolute inset-0" />
            <span className={cn('absolute bottom-3 left-3 max-w-[calc(100%-24px)] rounded-xl bg-white px-3 py-2 shadow-soft', i === 0 && 'lg:bottom-5 lg:left-5 lg:px-5 lg:py-3')}>
              <span className={cn('block truncate text-s4 font-bold text-ink', i === 0 && 'lg:text-d4')}>{it.name}</span>
              <Money value={it.price} className={cn('text-s5 text-brand-700', i === 0 && 'lg:text-s3')} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Spaces() {
  const { data: areas } = useCol('areas')
  const { data: tables } = useCol('tables')
  const seats = (ids) => tables.filter((t) => ids.includes(t.areaId) && t.isActive).reduce((s, t) => s + t.seats, 0)
  const ofType = (...types) => areas.filter((a) => a.isActive && types.includes(a.type)).map((a) => a.id)
  const rows = [
    ['Sảnh', `${seats(ofType('HALL', 'BAR'))} chỗ`],
    ['Sân thượng', `${seats(ofType('OUTDOOR'))} chỗ`],
    ['Phòng VIP', `${ofType('VIP_ROOM').length} phòng, từ 10 khách`],
  ]
  return (
    <section className="bg-brand-50 py-16 lg:py-20">
      <div className={cn(wrap, 'grid items-center gap-10 lg:grid-cols-3')}>
        <div>
          <h2 className="text-d3 font-extrabold text-ink lg:text-d2">Không gian</h2>
          <dl className="mt-6">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-t border-brand-200 py-4">
                <dt className="text-d4 font-bold text-ink">{k}</dt>
                <dd className="text-s3 text-ink-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid grid-cols-5 gap-3 sm:gap-4 lg:col-span-2">
          <DishPhoto src="/img/interior.jpg" alt="Không gian nhà hàng" className="col-span-3 h-56 rounded-site sm:h-96" />
          <DishPhoto src="/img/khonggian.jpg" alt="Bàn ăn trong nhà hàng" className="col-span-2 h-56 rounded-site sm:h-96" />
        </div>
      </div>
    </section>
  )
}

function Visit() {
  return (
    <section className="bg-brand-700 text-white">
      <div className={cn(wrap, 'flex flex-wrap items-center justify-between gap-8 py-14')}>
        <div>
          <p className="flex items-center gap-2 text-s3 font-medium"><MapPin size={17} aria-hidden="true" />10:00–22:00, cả tuần</p>
          <p className="mt-2 text-d3 font-extrabold tracking-tight lg:text-d1">Nguyễn Trãi, Thanh Xuân</p>
        </div>
        <Button asChild variant="inverse" size="lg"><Link to="/booking">Đặt bàn<ArrowRight size={18} aria-hidden="true" /></Link></Button>
      </div>
    </section>
  )
}
