import { Button, Empty, Select } from 'antd'
import { useState } from 'react'
import { api } from '../../shared/api/api'
import { byId, useCol, useRun } from '../../shared/api/hooks'
import { useStaff } from '../../shared/auth/authStore'
import { PageHeader, Toolbar } from '../../shared/components/ui'
import { minutesSince } from '../../shared/utils/format'

const COLS = [['PENDING', 'Chờ nấu', 'COOKING', 'Nấu'], ['COOKING', 'Đang nấu', 'READY', 'Xong'], ['READY', 'Chờ mang ra', null, null]]

export default function KitchenPage() {
  const { can } = useStaff()
  const run = useRun()
  const { data: lines } = useCol('orderItems')
  const { data: items } = useCol('items')
  const { data: cats } = useCol('categories')
  const orders = byId(useCol('orders').data)
  const tables = byId(useCol('tables').data)
  const itemMap = byId(items)
  const [catIds, setCatIds] = useState([])
  const write = can('kitchen:update')

  const soldOut = items.filter((i) => !i.isAvailable).map((i) => i.id)
  const setSoldOut = (ids) => {
    const changed = items.filter((i) => ids.includes(i.id) === i.isAvailable)
    run(() => Promise.all(changed.map((i) => api.update('items', i.id, { isAvailable: !ids.includes(i.id) }))), 'Đã cập nhật món hết')
  }
  const visible = lines.filter((l) => !catIds.length || catIds.includes(itemMap[l.itemId]?.categoryId))
  const move = (ls, next) => run(() => Promise.all(ls.map((l) => api.setItemStatus(l.id, next))))

  return (
    <>
      <PageHeader title="Màn hình bếp" />
      <Toolbar>
        <Select mode="multiple" allowClear placeholder="Danh mục" aria-label="Lọc danh mục" style={{ minWidth: 220 }} value={catIds} onChange={setCatIds} maxTagCount="responsive" options={cats.map((c) => ({ value: c.id, label: c.name }))} />
        {write && (
          <Select mode="multiple" allowClear placeholder="Báo hết món" aria-label="Món đã hết" style={{ minWidth: 280 }} value={soldOut} onChange={setSoldOut} maxTagCount="responsive"
            showSearch={{ optionFilterProp: 'label' }} options={items.map((i) => ({ value: i.id, label: i.name }))} />
        )}
      </Toolbar>
      <div className="kds">
        {COLS.map(([st, title, next, label]) => {
          const list = visible.filter((l) => l.status === st && (st !== 'READY' || minutesSince(l.readyAt) < 30)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          const tickets = [...new Set(list.map((l) => l.orderId))].map((orderId) => ({ orderId, ls: list.filter((l) => l.orderId === orderId) }))
          return (
            <section key={st} className="kds-col">
              <h2>{title} <span className="muted">{list.length}</span></h2>
              {!list.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trống" />}
              {tickets.map(({ orderId, ls }) => {
                const age = minutesSince(ls[0].createdAt)
                const late = st !== 'READY' && ls.some((l) => minutesSince(l.createdAt) > (itemMap[l.itemId]?.prepMinutes || 10) + 5)
                const t = tables[orders[orderId]?.tableId]
                return (
                  <article key={orderId} className={`kds-ticket${late ? ' late' : ''}`}>
                    <header>
                      <b>{t ? `Bàn ${t.code}` : 'Mang đi'}</b>
                      <span className="row-gap">
                        <span className={late ? 'text-bad' : 'muted'}>{age} phút</span>
                        {next && write && ls.length > 1 && <Button size="small" onClick={() => move(ls, next)}>{label} tất cả</Button>}
                      </span>
                    </header>
                    {ls.map((l) => (
                      <div key={l.id} className="kds-line">
                        <div><b>{l.qty}</b> × {itemMap[l.itemId]?.name}{l.note && <div className="kds-note">{l.note}</div>}</div>
                        {next && write && <Button size="small" type={next === 'READY' ? 'primary' : 'default'} onClick={() => move([l], next)}>{label}</Button>}
                      </div>
                    ))}
                  </article>
                )
              })}
            </section>
          )
        })}
      </div>
    </>
  )
}
