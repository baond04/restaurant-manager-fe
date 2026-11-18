import { Button, DatePicker, Descriptions, Drawer, Input, Rate, Select, Table, Tabs, Tag } from 'antd'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { ACCOUNT_STATUS, toOptions } from '@/constants'
import { fmtDate, fmtDateTime, inRange, matches, money } from '@/utils/format'

export const TIERS = { GOLD: ['Vàng', 'gold'], SILVER: ['Bạc', 'default'], BRONZE: ['Đồng', 'orange'] }
export const tierOf = (points) => (points >= 500 ? 'GOLD' : points >= 200 ? 'SILVER' : 'BRONZE')

export default function CustomersPage() {
  const { can } = useStaff()
  return (
    <>
      <PageHeader title="Khách và đánh giá" />
      <Tabs destroyOnHidden items={[
        can('customer:view') && { key: 'c', label: 'Khách hàng', children: <CustomersTab /> },
        can('review:moderate') && { key: 'r', label: 'Đánh giá', children: <ReviewsTab /> },
      ].filter(Boolean)} />
    </>
  )
}

function CustomersTab() {
  const { data: users, isLoading } = useCol('users')
  const { data: orders } = useCol('orders')
  const { data: bills } = useCol('bills')
  const [q, setQ] = useState('')
  const [tier, setTier] = useState()
  const [status, setStatus] = useState()
  const [range, setRange] = useState(null)
  const [detail, setDetail] = useState(null)
  const billByOrder = Object.fromEntries(bills.filter((b) => b.status === 'PAID').map((b) => [b.orderId, b]))
  const rows = users.filter((u) => u.kind === 'CUSTOMER').map((u) => {
    const os = orders.filter((o) => o.customerId === u.id && billByOrder[o.id])
    return { ...u, visits: os.length, spend: os.reduce((s, o) => s + billByOrder[o.id].total, 0), orders: os }
  }).filter((u) => matches(q, u.fullName, u.phone, u.email) && (!tier || tierOf(u.points) === tier) && (!status || u.status === status) && inRange(u.createdAt, range))

  return (
    <>
      <Toolbar onReset={() => { setQ(''); setTier(); setStatus(); setRange(null) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tên, điện thoại, email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Hạng" value={tier} onChange={setTier} options={toOptions(TIERS)} />
        <Select allowClear placeholder="Tài khoản" value={status} onChange={setStatus} options={toOptions(ACCOUNT_STATUS)} />
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" placeholder={['Đăng ký từ', 'đến']} />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 900 }} rowClassName="clickable-row" onRow={(u) => ({ onClick: () => setDetail(u) })} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} khách` }} columns={[
        { title: 'Họ tên', dataIndex: 'fullName', render: (v) => <b>{v}</b>, sorter: (a, b) => a.fullName.localeCompare(b.fullName) },
        { title: 'Điện thoại', dataIndex: 'phone' },
        { title: 'Hạng', render: (_, u) => <StatusTag map={TIERS} value={tierOf(u.points)} /> },
        { title: 'Điểm', dataIndex: 'points', className: 'num', sorter: (a, b) => a.points - b.points },
        { title: 'Lượt ăn', dataIndex: 'visits', className: 'num', sorter: (a, b) => a.visits - b.visits },
        { title: 'Tổng chi', dataIndex: 'spend', className: 'num', render: money, sorter: (a, b) => a.spend - b.spend },
        { title: 'Đăng ký', dataIndex: 'createdAt', render: fmtDate, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
        { title: 'Tài khoản', dataIndex: 'status', render: (v) => <StatusTag map={ACCOUNT_STATUS} value={v} /> },
      ]} />
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.fullName} size={480}>
        {detail && (
          <>
            <Descriptions column={1} size="small" items={[
              { label: 'Email', children: detail.email }, { label: 'Điện thoại', children: detail.phone },
              { label: 'Điểm', children: `${detail.points} (${TIERS[tierOf(detail.points)][0]})` }, { label: 'Tổng chi', children: money(detail.spend) },
            ]} />
            <Table size="small" rowKey="id" style={{ marginTop: 12 }} dataSource={[...detail.orders].reverse()} pagination={{ hideOnSinglePage: true, pageSize: 8 }} columns={[
              { title: 'Ngày', dataIndex: 'openedAt', render: fmtDateTime },
              { title: 'Hóa đơn', className: 'num', render: (_, o) => money(billByOrder[o.id]?.total) },
            ]} />
          </>
        )}
      </Drawer>
    </>
  )
}

function ReviewsTab() {
  const { data: reviews, isLoading } = useCol('reviews')
  const { data: itemsList } = useCol('items')
  const items = byId(itemsList)
  const users = byId(useCol('users').data)
  const crud = useCrud('reviews', 'đánh giá')
  const [q, setQ] = useState('')
  const [rating, setRating] = useState([])
  const [item, setItem] = useState()
  const [hidden, setHidden] = useState()
  const [range, setRange] = useState(null)
  const rows = reviews.filter((r) => matches(q, r.comment, users[r.customerId]?.fullName) && (!rating.length || rating.includes(r.rating)) && (!item || r.itemId === item)
    && (hidden === undefined || r.hidden === hidden) && inRange(r.createdAt, range)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <Toolbar onReset={() => { setQ(''); setRating([]); setItem(); setHidden(); setRange(null) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Nội dung, tên khách" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select mode="multiple" allowClear placeholder="Số sao" value={rating} onChange={setRating} options={[5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} sao` }))} style={{ minWidth: 160 }} />
        <Select allowClear showSearch={{ optionFilterProp: 'label' }} placeholder="Món" value={item} onChange={setItem} options={itemsList.map((i) => ({ value: i.id, label: i.name }))} />
        <Select allowClear placeholder="Hiển thị" value={hidden} onChange={setHidden} options={[{ value: false, label: 'Đang hiện' }, { value: true, label: 'Đã ẩn' }]} />
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 900 }} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} đánh giá` }} columns={[
        { title: 'Ngày', dataIndex: 'createdAt', render: fmtDate, width: 110 },
        { title: 'Khách', render: (_, r) => users[r.customerId]?.fullName },
        { title: 'Món', render: (_, r) => items[r.itemId]?.name },
        { title: 'Sao', dataIndex: 'rating', render: (v) => <Rate disabled value={v} style={{ fontSize: 14 }} />, sorter: (a, b) => a.rating - b.rating, width: 150 },
        { title: 'Nội dung', dataIndex: 'comment', render: (v, r) => <>{v}{r.hidden && <Tag style={{ marginLeft: 6 }}>Đã ẩn</Tag>}</> },
        { title: '', width: 130, render: (_, r) => <RowActions onDelete={() => crud.remove(r.id)} extra={<Button size="small" onClick={() => crud.save(r, { hidden: !r.hidden })}>{r.hidden ? 'Hiện' : 'Ẩn'}</Button>} /> },
      ]} />
    </>
  )
}
