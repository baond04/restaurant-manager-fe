import { BellRing, ConciergeBell, QrCode, ReceiptText, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Money } from '@/components/brand'
import { EmptyState, PageLoader } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useAuth } from '@/stores/authStore'
import { cn } from '@/utils/cn'
import { minutesSince } from '@/utils/format'
import ChatWidget from '@/components/chat/ChatWidget'
import ItemDetail from '@/pages/customer/components/ItemDetail'
import MenuList from '@/pages/table-order/components/MenuList'
import { CartDrawer, HelpTab, OrderTab } from '@/pages/table-order/components/Tabs'

const NAV = [['menu', 'Thực đơn', UtensilsCrossed], ['order', 'Đơn bàn', ReceiptText], ['help', 'Gọi NV', ConciergeBell]]

export default function TableOrderPage() {
  const { qrToken } = useParams()
  const run = useRun()
  const tableToken = useAuth((s) => s.tableToken)
  const setTableToken = useAuth((s) => s.setTableToken)
  const tableQ = useQuery({ queryKey: ['qr-table', qrToken], queryFn: () => api.tableByQr(qrToken), retry: false })
  // Bàn chưa mở thì máy chủ trả 409: thử lại 10 giây/lần, nhân viên mở bàn xong khách gọi món được ngay
  useQuery({
    queryKey: ['qr-join', qrToken], enabled: tableQ.isSuccess, retry: false, refetchInterval: (q) => (q.state.data ? false : 10_000),
    queryFn: () => api.joinTable(qrToken).then((r) => { setTableToken(r.token); return r }),
  })
  const joined = { enabled: !!tableToken }
  const { data: orders } = useCol('orders', joined)
  const { data: lines } = useCol('orderItems', joined)
  const { data: reqs } = useCol('serviceRequests', joined)
  const { data: categories } = useCol('categories')
  const { data: allItems } = useCol('items')
  const areas = byId(useCol('areas').data)
  const floors = byId(useCol('floors').data)
  const items = byId(allItems)
  const [cart, setCart] = useState([])
  const [tab, setTab] = useState('menu')
  const [cartOpen, setCartOpen] = useState(false)
  const [chat, setChat] = useState(false)
  const [detail, setDetail] = useState(null)

  if (tableQ.isLoading) return <PageLoader />
  const t = tableQ.data
  if (!t) return <div className="font-sans"><EmptyState icon={QrCode} title="Mã QR không còn hiệu lực" className="min-h-dvh">Nhờ nhân viên hỗ trợ.</EmptyState></div>

  const area = areas[t.areaId]
  const order = orders.find((o) => o.tableId === t.id && o.status === 'OPEN')
  const canOrder = !!order
  const sent = order ? lines.filter((l) => l.orderId === order.id) : []
  const myReqs = reqs.filter((r) => r.tableId === t.id && (r.status !== 'DONE' || (order && r.orderId === order.id))).slice(-6).reverse()
  const count = cart.reduce((s, l) => s + l.qty, 0)
  const total = cart.reduce((s, l) => s + l.qty * items[l.itemId].price, 0)
  const sold = new Map()
  lines.forEach((l) => sold.set(l.itemId, (sold.get(l.itemId) || 0) + l.qty))
  const popular = allItems.filter((i) => i.isAvailable && i.image).sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0)).slice(0, 8)
  const activeCats = categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

  const plain = (id) => (c) => c.find((x) => x.itemId === id && !x.note)
  const qtyOf = (it) => plain(it.id)(cart)?.qty ?? 0
  const setQty = (it, qty) => setCart((c) => {
    const ex = plain(it.id)(c)
    if (ex) return qty <= 0 ? c.filter((x) => x !== ex) : c.map((x) => (x === ex ? { ...x, qty } : x))
    return qty > 0 ? [...c, { key: crypto.randomUUID(), itemId: it.id, qty, note: '', source: 'MENU' }] : c
  })
  const addLine = (it, qty, note, source = 'MENU') => setCart((c) => {
    const ex = c.find((x) => x.itemId === it.id && x.note === note)
    return ex ? c.map((x) => (x === ex ? { ...x, qty: x.qty + qty } : x)) : [...c, { key: crypto.randomUUID(), itemId: it.id, qty, note, source }]
  })
  const patch = (key, p) => setCart((c) => (p.qty === 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, ...p } : x))))
  const send = () => run(() => api.addOrderItems({ orderId: order.id, tableId: t.id, lines: cart, source: 'MENU' }), 'Đã gửi món').then(() => { setCart([]); setCartOpen(false); setTab('order') }, () => {})
  const ask = (type, ok = 'Đã báo nhân viên') => run(() => api.createServiceRequest(qrToken, type), ok).catch(() => {})

  const asked = reqs.some((r) => r.tableId === t.id && r.type === 'CALL_STAFF' && r.status !== 'DONE')
  const billAsked = reqs.some((r) => r.tableId === t.id && r.type === 'REQUEST_BILL' && r.status !== 'DONE')

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-white pb-40 font-sans text-s4 text-ink">
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-brand-700 px-4 text-white">
        <div className="min-w-0">
          <h1 className="text-s2 leading-tight font-extrabold tabular-nums">Bàn {t.code}</h1>
          <p className="truncate text-s6">{floors[area?.floorId]?.name} · {area?.name}</p>
        </div>
        {order && <p className="shrink-0 text-right text-s6 tabular-nums"><b className="block text-s4 font-bold">{order.guestCount} khách</b>{minutesSince(order.openedAt)} phút</p>}
      </header>

      {!canOrder && (
        <div className="m-4 rounded-site bg-brand-100 p-4">
          <p className="text-s3 font-bold text-brand-900">Bàn chưa mở</p>
          <p className="mt-0.5 text-s4 text-brand-900">Xem thực đơn trước, bạn gọi được ngay khi nhân viên mở bàn.</p>
          <Button className="mt-3 w-full" size="lg" disabled={asked} loading={run.pending} onClick={() => ask('CALL_STAFF', 'Đã báo nhân viên mở bàn')}><BellRing size={18} aria-hidden="true" />{asked ? 'Đã báo nhân viên' : 'Báo nhân viên mở bàn'}</Button>
        </div>
      )}

      {tab === 'menu' && <MenuList items={allItems} categories={activeCats} popular={popular} qtyOf={qtyOf} setQty={setQty} canOrder={canOrder} onOpen={setDetail} />}
      {tab === 'order' && <OrderTab sent={sent} items={items} billRequested={billAsked} pending={run.pending} onRequestBill={() => ask('REQUEST_BILL', 'Đã báo thanh toán')} />}
      {tab === 'help' && <HelpTab requests={myReqs} pending={run.pending} onAsk={(type) => ask(type)} />}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl bg-white">
        {count > 0 && (
          <div className="px-3 pb-2">
            <button type="button" onClick={() => setCartOpen(true)} className="flex h-13 w-full cursor-pointer items-center justify-between rounded-control bg-brand-700 px-4 text-white shadow-float transition active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span className="flex items-center gap-2 text-s3 font-bold"><span key={count} className="flex size-7 animate-pop items-center justify-center rounded-full bg-white text-s5 text-brand-800 tabular-nums">{count}</span>Xem giỏ</span>
              <Money value={total} className="text-s3 font-bold" />
            </button>
          </div>
        )}
        <nav aria-label="Tại bàn" className="flex h-16 border-t border-brand-100 pb-[env(safe-area-inset-bottom)]">
          {NAV.map(([key, label, Icon]) => (
            <button key={key} type="button" aria-current={tab === key} onClick={() => { setTab(key); window.scrollTo(0, 0) }} className={cn('relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-s6 font-medium', tab === key ? 'text-brand-700' : 'text-ink-soft')}>
              <Icon size={21} aria-hidden="true" />{label}
              {key === 'order' && sent.length > 0 && <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-brand-700 px-1.5 text-[10px] font-bold text-white tabular-nums">{sent.length}</span>}
            </button>
          ))}
          <button type="button" onClick={() => setChat(true)} className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-s6 font-medium text-ink-soft"><Sparkles size={21} aria-hidden="true" />Hỏi AI</button>
        </nav>
      </div>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} cart={cart} items={items} total={total} pending={run.pending} onPatch={patch} onSend={send} />
      <ItemDetail item={detail} onClose={() => setDetail(null)} onAdd={canOrder ? (it, qty, note) => { addLine(it, qty, note); setDetail(null) } : undefined} />
      <ChatWidget open={chat} onClose={() => setChat(false)} onAdd={canOrder ? (it) => addLine(it, 1, '', 'CHATBOT') : undefined} />
    </div>
  )
}
