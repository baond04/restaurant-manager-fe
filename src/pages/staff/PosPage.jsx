import { Button, Empty, Input, InputNumber, Popconfirm, Select, Space } from 'antd'
import { Search, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { Chips, ItemThumb, PageHeader, StatusTag } from '@/components/common/ui'
import { ITEM_STATUS, TABLE_STATUS } from '@/constants'
import { matches, money } from '@/utils/format'

export default function PosPage() {
  const { user, can } = useStaff()
  const run = useRun()
  const [params, setParams] = useSearchParams()
  const { data: items } = useCol('items')
  const { data: cats } = useCol('categories')
  const { data: tables } = useCol('tables')
  const { data: areas } = useCol('areas')
  const { data: floors } = useCol('floors')
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const itemMap = byId(items)
  const [cat, setCat] = useState(0)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([])
  const tableParam = params.get('table')
  const target = tableParam === 'takeaway' ? 'takeaway' : tableParam ? +tableParam : null
  const order = typeof target === 'number' ? orders.find((o) => o.tableId === target && o.status === 'OPEN') : null
  const sent = order ? lines.filter((l) => l.orderId === order.id) : []

  const add = (it) => setCart((c) => {
    const ex = c.find((x) => x.itemId === it.id && !x.note)
    return ex ? c.map((x) => (x === ex ? { ...x, qty: x.qty + 1 } : x)) : [...c, { key: crypto.randomUUID(), itemId: it.id, qty: 1, note: '' }]
  })
  const patch = (key, p) => setCart((c) => c.map((x) => (x.key === key ? { ...x, ...p } : x)))
  const total = cart.reduce((s, l) => s + l.qty * (itemMap[l.itemId]?.price || 0), 0)
  const shown = items.filter((i) => (!cat || i.categoryId === cat) && matches(q, i.name))

  const tableOptions = floors.map((f) => ({
    label: f.name,
    options: tables.filter((t) => t.isActive && areas.find((a) => a.id === t.areaId)?.floorId === f.id).map((t) => ({ value: t.id, label: `${t.code} · ${t.seats} chỗ · ${TABLE_STATUS[t.status][0]}` })),
  }))

  const send = () => run(() => api.addOrderItems({
    orderId: order?.id, tableId: typeof target === 'number' ? target : null, type: target === 'takeaway' ? 'TAKEAWAY' : 'DINE_IN', openedBy: user.id, lines: cart,
  }), 'Đã gửi món').then(() => setCart([]))

  return (
    <>
      <PageHeader title="Gọi món" />
      <div className="pos">
        <div>
          <div className="toolbar">
            <Input allowClear prefix={<Search size={16} />} placeholder="Tìm món" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}><Chips label="Danh mục" value={cat} onChange={setCat} options={[{ value: 0, label: 'Tất cả', count: items.length }, ...cats.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name, count: items.filter((i) => i.categoryId === c.id).length }))]} /></div>
          <div className="menu-grid">
            {shown.map((it) => (
              <button type="button" key={it.id} className="menu-card" disabled={!it.isAvailable} onClick={() => add(it)}>
                <ItemThumb item={it} />
                <span className="menu-card-body"><span>{it.name}</span><span className="price">{it.isAvailable ? money(it.price) : 'Hết món'}</span></span>
              </button>
            ))}
          </div>
        </div>

        <aside className="card sticky order-panel">
          <Select showSearch={{ optionFilterProp: 'label' }} placeholder="Chọn bàn hoặc mang đi" style={{ width: '100%' }} value={target ?? undefined}
            onChange={(v) => setParams({ table: String(v) })}
            options={[{ label: 'Khác', options: [{ value: 'takeaway', label: 'Mang đi' }] }, ...tableOptions]} />

          {sent.length > 0 && (
            <div>
              <b>Đã gọi</b>
              {sent.map((l) => (
                <div key={l.id} className="cart-line">
                  <span>{l.qty} × {itemMap[l.itemId]?.name}</span>
                  <Space size={4}>
                    <StatusTag map={ITEM_STATUS} value={l.status} />
                    {l.status === 'PENDING' && can('order:cancel_item') && (
                      <Popconfirm title="Hủy món này?" okText="Hủy món" cancelText="Không" onConfirm={() => run(() => api.cancelOrderItem(l.id), 'Đã hủy món')}>
                        <Button type="text" size="small" danger aria-label="Hủy món" icon={<Trash2 size={16} />} />
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          )}

          <div>
            <b>Món mới</b>
            {!cart.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa chọn món" />}
            {cart.map((l) => (
              <div key={l.key} className="cart-line">
                <span>{itemMap[l.itemId]?.name}</span>
                <InputNumber size="small" min={0} value={l.qty} style={{ width: 70 }} aria-label="Số lượng"
                  onChange={(v) => (v ? patch(l.key, { qty: v }) : setCart((c) => c.filter((x) => x.key !== l.key)))} />
                <Input size="small" placeholder="Ghi chú" value={l.note} onChange={(e) => patch(l.key, { note: e.target.value })} style={{ gridColumn: '1 / -1' }} />
              </div>
            ))}
          </div>
          <div className="row-between"><span>Tạm tính</span><b>{money(total)}</b></div>
          <Button type="primary" block size="large" icon={<Send size={16} />} disabled={!cart.length || !target} loading={run.pending} onClick={send}>Gửi món</Button>
        </aside>
      </div>
    </>
  )
}
