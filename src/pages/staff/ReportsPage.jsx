import { Button, DatePicker, Select, Tabs } from 'antd'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import ChartCard from '@/components/common/ChartCard'
import { PageHeader, Stat, Toolbar } from '@/components/common/ui'
import { PAY_METHOD } from '@/constants'
import { dayjs, inRange, money } from '@/utils/format'
import { TIERS, tierOf } from '@/pages/staff/CustomersPage'

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '0%')
const delta = (cur, prev) => (prev ? `${cur >= prev ? '+' : ''}${Math.round(((cur - prev) / prev) * 100)}% so với kỳ trước` : null)
/** Gộp theo khóa, trả [{label, value}] đã sắp xếp giảm dần (hoặc giữ thứ tự khóa nếu keepOrder). */
function group(rows, keyFn, valFn = () => 1, keepOrder) {
  const m = new Map()
  rows.forEach((r) => { const k = keyFn(r); if (k != null) m.set(k, (m.get(k) || 0) + valFn(r)) })
  const out = [...m].map(([label, value]) => ({ label, value }))
  return keepOrder ? out : out.sort((a, b) => b.value - a.value)
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0 }
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0 }

function downloadCsv(name, rows) {
  const csv = '﻿' + ['Mục,Giá trị', ...rows.map((r) => `"${String(r.label).replace(/"/g, '""')}",${r.value}`)].join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `${name}.csv` })
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ReportsPage() {
  const { can } = useStaff()
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()])
  const [floorId, setFloorId] = useState()
  const [tab, setTab] = useState('revenue')
  const d = useReportData(range, floorId)
  const exportRows = { revenue: d.revenueByDay, items: d.topItems, tables: d.byArea, staff: d.byCashier, inventory: d.consumption, customers: d.byTier, ai: d.chatByDay }[tab]

  return (
    <>
      <PageHeader title="Báo cáo" extra={can('report:export') && <Button icon={<Download size={16} />} onClick={() => downloadCsv(`bao-cao-${tab}-${range[0].format('YYYYMMDD')}-${range[1].format('YYYYMMDD')}`, exportRows)}>Xuất CSV</Button>} />
      <Toolbar>
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} format="DD/MM/YYYY" allowClear={false} disabledDate={(x) => x.isAfter(dayjs(), 'day')} presets={[
          { label: 'Hôm nay', value: [dayjs(), dayjs()] }, { label: '7 ngày', value: [dayjs().subtract(6, 'day'), dayjs()] }, { label: '30 ngày', value: [dayjs().subtract(29, 'day'), dayjs()] },
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] }, { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
        ]} />
        <Select allowClear placeholder="Tất cả tầng" value={floorId} onChange={setFloorId} options={d.floors.map((f) => ({ value: f.id, label: f.name }))} />
      </Toolbar>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'revenue', label: 'Doanh thu', children: (
          <>
            <div className="stats">
              <Stat label="Doanh thu" value={money(d.revenue)} sub={delta(d.revenue, d.prevRevenue)} />
              <Stat label="Số hóa đơn" value={d.paid.length} sub={delta(d.paid.length, d.prevPaid.length)} />
              <Stat label="Trung bình mỗi hóa đơn" value={money(d.paid.length ? d.revenue / d.paid.length : 0)} />
              <Stat label="Giảm giá" value={money(d.paid.reduce((s, b) => s + b.discount + b.pointsAmount, 0))} />
              <Stat label="Phụ thu và bù tối thiểu" value={money(d.paid.reduce((s, b) => s + b.serviceFee + b.minSpendTopUp, 0))} />
            </div>
            <div className="grid-2">
              <ChartCard title="Doanh thu theo ngày" kind="line" data={d.revenueByDay} fmt={money} valueLabel="Doanh thu" />
              <ChartCard title="Doanh thu theo giờ" data={d.revenueByHour} fmt={money} valueLabel="Doanh thu" />
              <ChartCard title="Theo phương thức thanh toán" kind="hbar" data={d.byMethod} fmt={money} valueLabel="Doanh thu" />
              <ChartCard title="Theo khu vực" kind="hbar" data={d.revenueByArea} fmt={money} valueLabel="Doanh thu" />
            </div>
          </>
        ) },
        { key: 'items', label: 'Món ăn', children: (
          <>
            <div className="stats">
              <Stat label="Món đã bán" value={d.soldQty} />
              <Stat label="Tỉ lệ hủy món" value={pct(d.cancelled, d.lines.length)} />
              <Stat label="Món gọi từ gợi ý AI" value={pct(d.fromAi, d.soldLines.length)} />
            </div>
            <div className="grid-2">
              <ChartCard title="Bán chạy nhất" kind="hbar" data={d.topItems.slice(0, 10)} valueLabel="Số phần" />
              <ChartCard title="Bán chậm nhất" kind="hbar" data={d.topItems.slice(-10).reverse()} valueLabel="Số phần" />
              <ChartCard title="Doanh thu theo danh mục" kind="hbar" data={d.byCategory} fmt={money} valueLabel="Doanh thu" />
            </div>
          </>
        ) },
        { key: 'tables', label: 'Bàn và đặt bàn', children: (
          <>
            <div className="stats">
              <Stat label="Lượt khách mỗi bàn mỗi ngày" value={d.turnover.toFixed(1)} />
              <Stat label="Thời gian ngồi trung bình" value={`${d.avgSeat} phút`} />
              <Stat label="Lượt đặt bàn" value={d.res.length} />
              <Stat label="Tỉ lệ không đến" value={pct(d.res.filter((r) => r.status === 'NO_SHOW').length, d.res.length)} />
            </div>
            <div className="grid-2">
              <ChartCard title="Số lượt khách theo khu vực" kind="hbar" data={d.byArea} valueLabel="Lượt" />
              <ChartCard title="Số bàn có khách theo giờ" data={d.ordersByHour} valueLabel="Lượt" />
            </div>
          </>
        ) },
        { key: 'staff', label: 'Nhân viên', children: (
          <div className="grid-2">
            <ChartCard title="Doanh thu theo thu ngân" kind="hbar" data={d.byCashier} fmt={money} valueLabel="Doanh thu" />
            <ChartCard title="Số bàn phục vụ" kind="hbar" data={d.byWaiter} valueLabel="Bàn" />
            <ChartCard title="Thời gian từ lúc món xong đến lúc mang ra (trung bình)" kind="hbar" data={d.serveTime} fmt={(v) => `${v} phút`} valueLabel="Phút" />
          </div>
        ) },
        { key: 'inventory', label: 'Kho', children: (
          <>
            <div className="stats">
              <Stat label="Doanh thu món" value={money(d.itemRevenue)} />
              <Stat label="Giá vốn ước tính" value={money(d.cogs)} />
              <Stat label="Lãi gộp" value={money(d.itemRevenue - d.cogs)} sub={pct(d.itemRevenue - d.cogs, d.itemRevenue)} />
            </div>
            <ChartCard title="Tiêu hao nguyên liệu (theo giá nhập)" kind="hbar" data={d.consumption} fmt={money} valueLabel="Giá trị" />
          </>
        ) },
        { key: 'customers', label: 'Khách hàng', children: (
          <>
            <div className="stats">
              <Stat label="Khách mới" value={d.newCustomers.length} />
              <Stat label="Khách quay lại" value={d.returning} />
              <Stat label="Điểm đã cấp" value={d.paid.reduce((s, b) => s + (b.pointsEarned || 0), 0)} />
              <Stat label="Điểm đã dùng" value={d.paid.reduce((s, b) => s + (b.pointsUsed || 0), 0)} />
            </div>
            <div className="grid-2">
              <ChartCard title="Khách theo hạng" kind="hbar" data={d.byTier} valueLabel="Khách" />
              <ChartCard title="Khách đăng ký mới theo ngày" data={d.newByDay} valueLabel="Khách" />
            </div>
          </>
        ) },
        { key: 'ai', label: 'Trợ lý AI', children: (
          <>
            <div className="stats">
              <Stat label="Hội thoại" value={d.chats.length} />
              <Stat label="Phản hồi hữu ích" value={pct(d.chats.filter((c) => c.feedback === 1).length, d.chats.filter((c) => c.feedback).length)} />
              <Stat label="Có thêm món vào giỏ" value={pct(d.chats.filter((c) => c.addedToCart).length, d.chats.length)} />
              <Stat label="Doanh thu món từ gợi ý" value={money(d.aiRevenue)} />
              <Stat label="Độ trễ trung vị / p95" value={`${(median(d.chats.map((c) => c.latencyMs)) / 1000).toFixed(1)}s / ${(p95(d.chats.map((c) => c.latencyMs)) / 1000).toFixed(1)}s`} />
            </div>
            <ChartCard title="Hội thoại theo ngày" data={d.chatByDay} valueLabel="Hội thoại" />
          </>
        ) },
      ]} />
    </>
  )
}

function useReportData(range, floorId) {
  const { data: bills } = useCol('bills')
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const { data: floors } = useCol('floors')
  const { data: reservations } = useCol('reservations')
  const { data: txs } = useCol('inventoryTx')
  const { data: users } = useCol('users')
  const { data: chatSessions } = useCol('chatSessions')
  const tables = byId(useCol('tables').data)
  const areas = byId(useCol('areas').data)
  const items = byId(useCol('items').data)
  const cats = byId(useCol('categories').data)
  const ings = byId(useCol('ingredients').data)
  const userMap = byId(users)
  const orderMap = byId(orders)

  const days = range[1].startOf('day').diff(range[0].startOf('day'), 'day') + 1
  const prevRange = [range[0].subtract(days, 'day'), range[0].subtract(1, 'day')]
  const floorOk = (o) => !floorId || areas[tables[o?.tableId]?.areaId]?.floorId === floorId
  const paidIn = (r) => bills.filter((b) => b.status === 'PAID' && inRange(b.paidAt, r) && floorOk(orderMap[b.orderId]))
  const paid = paidIn(range)
  const prevPaid = paidIn(prevRange)
  const paidOrderIds = new Set(paid.map((b) => b.orderId))
  const ordersIn = orders.filter((o) => paidOrderIds.has(o.id))
  const lns = lines.filter((l) => paidOrderIds.has(l.orderId))
  const soldLines = lns.filter((l) => l.status !== 'CANCELLED')
  const dayKeys = Array.from({ length: days }, (_, i) => range[0].add(i, 'day').format('DD/MM'))
  const fillDays = (rows) => { const m = Object.fromEntries(rows.map((r) => [r.label, r.value])); return dayKeys.map((label) => ({ label, value: m[label] || 0 })) }

  const lineCost = (l) => {
    const rec = items[l.itemId]?.recipe ?? []
    return rec.length ? rec.reduce((s, x) => s + x.qty * (ings[x.ingredientId]?.cost || 0), 0) * l.qty : l.qty * l.unitPrice * 0.35
  }
  const seatMins = ordersIn.filter((o) => o.closedAt).map((o) => dayjs(o.closedAt).diff(o.openedAt, 'minute'))
  const serveByWaiter = new Map()
  soldLines.filter((l) => l.servedAt && l.readyAt && l.servedBy).forEach((l) => {
    const a = serveByWaiter.get(l.servedBy) || []; a.push(dayjs(l.servedAt).diff(l.readyAt, 'minute')); serveByWaiter.set(l.servedBy, a)
  })
  const custOrders = group(ordersIn.filter((o) => o.customerId), (o) => o.customerId)
  const customers = users.filter((u) => u.kind === 'CUSTOMER')
  const newCustomers = customers.filter((u) => inRange(u.createdAt, range))
  const chats = chatSessions.filter((c) => inRange(c.createdAt, range))

  return {
    floors, paid, prevPaid, lines: lns, soldLines,
    revenue: paid.reduce((s, b) => s + b.total, 0),
    prevRevenue: prevPaid.reduce((s, b) => s + b.total, 0),
    revenueByDay: fillDays(group(paid, (b) => dayjs(b.paidAt).format('DD/MM'), (b) => b.total)),
    revenueByHour: group(paid, (b) => dayjs(b.paidAt).hour(), (b) => b.total).sort((a, b) => a.label - b.label).map((r) => ({ label: `${r.label}h`, value: r.value })),
    byMethod: group(paid, (b) => PAY_METHOD[b.method], (b) => b.total),
    revenueByArea: group(paid, (b) => areas[tables[orderMap[b.orderId]?.tableId]?.areaId]?.name ?? 'Mang đi', (b) => b.total),
    soldQty: soldLines.reduce((s, l) => s + l.qty, 0),
    cancelled: lns.filter((l) => l.status === 'CANCELLED').length,
    fromAi: soldLines.filter((l) => l.source === 'CHATBOT').length,
    topItems: group(soldLines, (l) => items[l.itemId]?.name, (l) => l.qty),
    byCategory: group(soldLines, (l) => cats[items[l.itemId]?.categoryId]?.name, (l) => l.qty * l.unitPrice),
    turnover: ordersIn.length / Math.max(1, Object.values(tables).filter((t) => t.isActive && floorOk({ tableId: t.id })).length) / days,
    avgSeat: seatMins.length ? Math.round(seatMins.reduce((a, b) => a + b, 0) / seatMins.length) : 0,
    res: reservations.filter((r) => inRange(r.time, range) && dayjs(r.time).isBefore(dayjs()) && (!floorId || areas[r.areaId]?.floorId === floorId)),
    byArea: group(ordersIn, (o) => areas[tables[o.tableId]?.areaId]?.name ?? 'Mang đi'),
    ordersByHour: group(ordersIn, (o) => dayjs(o.openedAt).hour()).sort((a, b) => a.label - b.label).map((r) => ({ label: `${r.label}h`, value: r.value })),
    byCashier: group(paid, (b) => userMap[b.cashierId]?.fullName, (b) => b.total),
    byWaiter: group(ordersIn, (o) => userMap[o.openedBy]?.fullName),
    serveTime: [...serveByWaiter].map(([id, a]) => ({ label: userMap[id]?.fullName, value: Math.round(a.reduce((x, y) => x + y, 0) / a.length) })).sort((a, b) => b.value - a.value),
    itemRevenue: soldLines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
    cogs: Math.round(soldLines.reduce((s, l) => s + lineCost(l), 0)),
    consumption: group(txs.filter((t) => ['CONSUME', 'EXPORT'].includes(t.type) && inRange(t.createdAt, range)), (t) => ings[t.ingredientId]?.name, (t) => Math.round(t.qty * t.unitCost)),
    newCustomers,
    returning: custOrders.filter((c) => c.value >= 2).length,
    byTier: group(customers, (u) => TIERS[tierOf(u.points)][0]),
    newByDay: fillDays(group(newCustomers, (u) => dayjs(u.createdAt).format('DD/MM'))),
    chats,
    aiRevenue: soldLines.filter((l) => l.source === 'CHATBOT').reduce((s, l) => s + l.qty * l.unitPrice, 0),
    chatByDay: fillDays(group(chats, (c) => dayjs(c.createdAt).format('DD/MM'))),
  }
}
