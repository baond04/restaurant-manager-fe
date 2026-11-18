import { Row, Rows } from '@/components/common/Rows'
import { Link } from 'react-router'
import { byId, useCol } from '@/hooks/useApi'
import ChartCard from '@/components/common/ChartCard'
import { PageHeader, Stat } from '@/components/common/ui'
import { dayjs, fmtTime, money } from '@/utils/format'

export default function DashboardPage() {
  const { data: bills } = useCol('bills')
  const { data: tables } = useCol('tables')
  const { data: lines } = useCol('orderItems')
  const { data: res } = useCol('reservations')
  const { data: ings } = useCol('ingredients')
  const tmap = byId(tables)
  const paid = bills.filter((b) => b.status === 'PAID')
  const sumDay = (d) => paid.filter((b) => dayjs(b.paidAt).isSame(d, 'day')).reduce((s, b) => s + b.total, 0)
  const today = sumDay(dayjs())
  const active = tables.filter((t) => t.isActive)
  const upcoming = res.filter((r) => ['PENDING', 'CONFIRMED'].includes(r.status) && dayjs(r.time).isAfter(dayjs()) && dayjs(r.time).isBefore(dayjs().endOf('day'))).sort((a, b) => a.time.localeCompare(b.time))
  const low = ings.filter((g) => g.stock < g.minStock)
  const week = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day')).map((d) => ({ label: d.format('dd DD/MM'), value: sumDay(d) }))

  return (
    <>
      <PageHeader title="Tổng quan" extra={<Link to="/staff/reports">Xem báo cáo</Link>} />
      <div className="stats">
        <Stat label="Doanh thu hôm nay" value={money(today)} sub={`Hôm qua ${money(sumDay(dayjs().subtract(1, 'day')))}`} />
        <Stat label="Bàn có khách" value={`${active.filter((t) => t.status === 'OCCUPIED').length}/${active.length}`} />
        <Stat label="Món đã gọi hôm nay" value={lines.filter((l) => l.status !== 'CANCELLED' && dayjs(l.createdAt).isSame(dayjs(), 'day')).reduce((s, l) => s + l.qty, 0)} />
        <Stat label="Đặt bàn còn lại hôm nay" value={upcoming.length} />
      </div>
      <div className="grid-2">
        <ChartCard title="Doanh thu 7 ngày" height={420} data={week} fmt={money} valueLabel="Doanh thu" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="card">
            <h2 className="card-title">Đặt bàn sắp tới</h2>
            <Rows data={upcoming.slice(0, 5)} empty="Không có">{(r) => (
              <Row><b>{fmtTime(r.time)}</b> {r.guestName} · {r.guestCount} khách · {r.tableIds.map((id) => tmap[id]?.code).join(', ')}</Row>
            )}</Rows>
          </section>
          <section className="card">
            <h2 className="card-title">Nguyên liệu dưới mức tối thiểu</h2>
            <Rows data={low} empty="Đủ hàng">{(g) => (
              <Row title={g.name} extra={<span className="text-bad">{g.stock}/{g.minStock} {g.unit}</span>} />
            )}</Rows>
          </section>
        </div>
      </div>
    </>
  )
}
