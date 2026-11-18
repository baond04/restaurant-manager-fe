import { Button, Form, Input, Modal, Popconfirm, Rate, Select, Table, Tabs } from 'antd'
import { Row, Rows } from '@/components/common/Rows'
import { Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useCustomer } from '@/stores/authStore'
import { StatusTag } from '@/components/common/ui'
import { RES_STATUS } from '@/constants'
import { dayjs, fmtDateTime, money } from '@/utils/format'
import { TIERS, tierOf } from '@/pages/staff/CustomersPage'

export default function AccountPage() {
  const me = useCustomer()
  const [params, setParams] = useSearchParams()
  if (!me) return <Navigate to="/login" replace />
  return (
    <div className="wrap page">
      <h1 className="page-title" style={{ marginBottom: 4 }}>{me.fullName}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Hạng {TIERS[tierOf(me.points)][0]} · {me.points} điểm</p>
      <Tabs activeKey={params.get('tab') || 'reservations'} onChange={(tab) => setParams({ tab })} items={[
        { key: 'reservations', label: 'Đặt bàn', children: <MyReservations me={me} /> },
        { key: 'orders', label: 'Lịch sử ăn', children: <MyOrders me={me} /> },
        { key: 'profile', label: 'Hồ sơ', children: <Profile me={me} /> },
        { key: 'sessions', label: 'Thiết bị đăng nhập', children: <Sessions /> },
      ]} />
    </div>
  )
}

function MyReservations({ me }) {
  const run = useRun()
  const { data } = useCol('reservations')
  const tables = byId(useCol('tables').data)
  const rows = data.filter((r) => r.customerId === me.id).sort((a, b) => b.time.localeCompare(a.time))
  return (
    <Table rowKey="id" dataSource={rows} pagination={{ hideOnSinglePage: true, pageSize: 8 }} scroll={{ x: 560 }} columns={[
      { title: 'Thời gian', dataIndex: 'time', render: fmtDateTime },
      { title: 'Số khách', dataIndex: 'guestCount', className: 'num' },
      { title: 'Bàn', render: (_, r) => r.tableIds.map((id) => tables[id]?.code).join(', ') },
      { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag map={RES_STATUS} value={v} /> },
      { title: '', render: (_, r) => ['PENDING', 'CONFIRMED'].includes(r.status) && dayjs(r.time).isAfter(dayjs()) && (
        <Popconfirm title="Hủy lượt đặt này?" okText="Hủy đặt bàn" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => run(() => api.setReservationStatus(r.id, 'CANCELLED'), 'Đã hủy')}>
          <Button size="small" danger>Hủy</Button>
        </Popconfirm>
      ) },
    ]} />
  )
}

function MyOrders({ me }) {
  const run = useRun()
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const { data: reviews } = useCol('reviews')
  const bills = Object.fromEntries(useCol('bills').data.map((b) => [b.orderId, b]))
  const items = byId(useCol('items').data)
  const [rating, setRating] = useState(null)
  const [shown, setShown] = useState(5)
  const rows = orders.filter((o) => o.customerId === me.id && bills[o.id]).sort((a, b) => b.openedAt.localeCompare(a.openedAt))
  return (
    <>
      {!rows.length && <p className="muted">Chưa có đơn.</p>}
      {rows.slice(0, shown).map((o) => (
        <div key={o.id} className="card" style={{ marginBottom: 8 }}>
          <div className="row-between"><b>{fmtDateTime(o.openedAt)}</b><b>{money(bills[o.id].total)}</b></div>
          {lines.filter((l) => l.orderId === o.id && l.status !== 'CANCELLED').map((l) => {
            const done = reviews.find((r) => r.customerId === me.id && r.itemId === l.itemId && r.orderId === o.id)
            return (
              <div key={l.id} className="row-between" style={{ padding: '4px 0' }}>
                <span>{l.qty} × {items[l.itemId]?.name}</span>
                {done ? <Rate disabled value={done.rating} style={{ fontSize: 12 }} /> : <Button size="small" type="link" onClick={() => setRating({ orderId: o.id, itemId: l.itemId })}>Đánh giá</Button>}
              </div>
            )
          })}
        </div>
      ))}
      {rows.length > shown && <Button block onClick={() => setShown(shown + 5)}>Xem thêm</Button>}
      {rating && (
        <ReviewModal itemName={items[rating.itemId]?.name} onClose={() => setRating(null)}
          onSubmit={(v) => run(() => api.create('reviews', { ...rating, ...v, customerId: me.id, hidden: false }), 'Cảm ơn bạn đã đánh giá').then(() => setRating(null))} />
      )}
    </>
  )
}

function ReviewModal({ itemName, onClose, onSubmit }) {
  const [form] = Form.useForm()
  return (
    <Modal open title={`Đánh giá ${itemName}`} okText="Gửi" cancelText="Hủy" onCancel={onClose} onOk={form.submit}>
      <Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ rating: 5 }}>
        <Form.Item name="rating" label="Số sao" rules={[{ required: true }]}><Rate /></Form.Item>
        <Form.Item name="comment" label="Nhận xét"><Input.TextArea rows={3} maxLength={1000} /></Form.Item>
      </Form>
    </Modal>
  )
}

function Profile({ me }) {
  const run = useRun()
  const { data: tags } = useCol('tags')
  const opts = tags.map((t) => ({ value: t.id, label: t.name }))
  return (
    <Form layout="vertical" style={{ maxWidth: 560 }} initialValues={me} onFinish={(v) => run(() => api.update('users', me.id, v), 'Đã lưu')}>
      <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input /></Form.Item>
      <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: 'Số điện thoại 10 số' }]}><Input /></Form.Item>
      <Form.Item name="email" label="Email"><Input disabled /></Form.Item>
      <Form.Item name="likeTagIds" label="Món bạn thích"><Select mode="multiple" options={opts} /></Form.Item>
      <Form.Item name="allergyTagIds" label="Dị ứng"><Select mode="multiple" options={opts.filter((o) => tags.find((t) => t.id === o.value)?.type === 'INGREDIENT')} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={run.pending}>Lưu</Button>
    </Form>
  )
}

function Sessions() {
  const run = useRun()
  const [list, setList] = useState([
    { id: 'a', icon: Monitor, name: 'Chrome trên Windows', where: 'Hà Nội', at: dayjs(), current: true },
    { id: 'b', icon: Smartphone, name: 'Safari trên iPhone', where: 'Hà Nội', at: dayjs().subtract(2, 'day') },
  ])
  return (
    <div style={{ maxWidth: 560 }}>
      <Rows data={list} footer={list.length > 1 && <Button danger onClick={() => run(async () => setList((l) => l.filter((s) => s.current)), 'Đã đăng xuất thiết bị khác')}>Đăng xuất mọi thiết bị khác</Button>}>{(s) => (
        <Row avatar={<s.icon size={20} aria-hidden="true" />} title={s.name} desc={`${s.where} · ${s.at.format('HH:mm DD/MM/YYYY')}`}
          extra={s.current ? <span className="muted">Thiết bị này</span> : <Button size="small" onClick={() => setList((l) => l.filter((x) => x.id !== s.id))}>Đăng xuất</Button>} />
      )}</Rows>
    </div>
  )
}
