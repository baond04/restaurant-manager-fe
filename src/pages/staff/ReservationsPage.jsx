import { Button, DatePicker, Dropdown, Form, Input, InputNumber, Modal, Select, Table } from 'antd'
import { Ellipsis, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import TablePicker, { TimeSelect } from '@/components/common/TablePicker'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { RES_STATUS, toOptions } from '@/constants'
import { atSlot, tableConflict } from '@/utils/booking'
import { dayjs, fmtDateTime, inRange, matches } from '@/utils/format'

const NEXT = {
  PENDING: [['CONFIRMED', 'Xác nhận'], ['CANCELLED', 'Từ chối']],
  CONFIRMED: [['SEATED', 'Nhận bàn'], ['NO_SHOW', 'Không đến'], ['CANCELLED', 'Hủy']],
  SEATED: [['COMPLETED', 'Hoàn thành']],
}

export default function ReservationsPage() {
  const { user, can } = useStaff()
  const run = useRun()
  const { data: rows, isLoading } = useCol('reservations')
  const { data: floors } = useCol('floors')
  const tables = byId(useCol('tables').data)
  const areas = byId(useCol('areas').data)
  const [q, setQ] = useState('')
  const [range, setRange] = useState([dayjs(), dayjs().add(7, 'day')])
  const [status, setStatus] = useState([])
  const [floorId, setFloorId] = useState()
  const [editing, setEditing] = useState(null)

  const data = rows
    .filter((r) => matches(q, r.guestName, r.guestPhone) && inRange(r.time, range) && (!status.length || status.includes(r.status)) && (!floorId || areas[r.areaId]?.floorId === floorId))
    .sort((a, b) => a.time.localeCompare(b.time))
  const manage = can('reservation:manage')

  const columns = [
    { title: 'Thời gian', dataIndex: 'time', render: fmtDateTime, sorter: (a, b) => a.time.localeCompare(b.time), width: 150 },
    { title: 'Người đặt', render: (_, r) => <><b>{r.guestName}</b><div className="muted">{r.guestPhone}</div></> },
    { title: 'Khách', dataIndex: 'guestCount', className: 'num', width: 90, sorter: (a, b) => a.guestCount - b.guestCount },
    { title: 'Bàn', render: (_, r) => r.tableIds.map((id) => tables[id]?.code).join(', ') || <span className="muted">Chưa gán</span> },
    { title: 'Khu vực', render: (_, r) => areas[r.areaId]?.name },
    { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag map={RES_STATUS} value={v} />, width: 130 },
    manage && {
      title: '', width: 110, render: (_, r) => (
        <RowActions onEdit={['PENDING', 'CONFIRMED'].includes(r.status) ? () => setEditing(r) : null} extra={NEXT[r.status] && (
          <Dropdown trigger={['click']} menu={{
            items: NEXT[r.status].map(([k, label]) => ({ key: k, label, danger: ['CANCELLED', 'NO_SHOW'].includes(k) })),
            onClick: ({ key }) => run(() => api.setReservationStatus(r.id, key, { openedBy: user.id }), RES_STATUS[key][0]),
          }}>
            <Button type="text" size="small" aria-label="Đổi trạng thái" icon={<Ellipsis size={16} />} />
          </Dropdown>
        )} />
      ),
    },
  ].filter(Boolean)

  return (
    <>
      <PageHeader title="Đặt bàn" extra={manage && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({})}>Thêm đặt bàn</Button>} />
      <Toolbar onReset={() => { setQ(''); setStatus([]); setFloorId(); setRange([dayjs(), dayjs().add(7, 'day')]) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tên, số điện thoại" value={q} onChange={(e) => setQ(e.target.value)} />
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" presets={[
          { label: 'Hôm nay', value: [dayjs(), dayjs()] }, { label: '7 ngày tới', value: [dayjs(), dayjs().add(7, 'day')] }, { label: '7 ngày qua', value: [dayjs().subtract(7, 'day'), dayjs()] },
        ]} />
        <Select mode="multiple" allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={toOptions(RES_STATUS)} style={{ minWidth: 200 }} />
        <Select allowClear placeholder="Tầng" value={floorId} onChange={setFloorId} options={floors.map((f) => ({ value: f.id, label: f.name }))} />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} columns={columns} dataSource={data} pagination={{ hideOnSinglePage: true, pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n} lượt` }} scroll={{ x: 900 }} />
      {editing && <ReservationForm value={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ReservationForm({ value, onClose }) {
  const run = useRun()
  const { data: reservations } = useCol('reservations')
  const { data: floors } = useCol('floors')
  const { data: areas } = useCol('areas')
  const { data: tables } = useCol('tables')
  const { data: users } = useCol('users')
  const [form] = Form.useForm()
  const isNew = !value.id
  const init = isNew
    ? { date: dayjs(), slot: undefined, guestCount: 2, tableIds: [], status: 'CONFIRMED' }
    : { ...value, date: dayjs(value.time), slot: dayjs(value.time).format('HH:mm') }
  const date = Form.useWatch('date', form) ?? init.date
  const slot = Form.useWatch('slot', form)
  const guests = Form.useWatch('guestCount', form) ?? init.guestCount
  const picked = Form.useWatch('tableIds', form) ?? init.tableIds
  const tmap = byId(tables)
  const seats = picked.reduce((s, id) => s + (tmap[id]?.seats || 0), 0)

  const submit = (v) => {
    const time = atSlot(v.date, v.slot).toISOString()
    const body = { guestName: v.guestName, guestPhone: v.guestPhone, customerId: v.customerId ?? null, guestCount: v.guestCount, time, tableIds: v.tableIds, areaId: tmap[v.tableIds[0]]?.areaId ?? null, note: v.note || '' }
    run(() => (isNew ? api.create('reservations', { ...body, status: 'CONFIRMED' }) : api.update('reservations', value.id, body)), isNew ? 'Đã thêm đặt bàn' : 'Đã lưu').then(onClose)
  }

  return (
    <Modal open title={isNew ? 'Thêm đặt bàn' : 'Sửa đặt bàn'} width={760} okText="Lưu" cancelText="Hủy" onCancel={onClose} onOk={form.submit} confirmLoading={run.pending} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={init} onFinish={submit} requiredMark={false}>
        <div className="grid-3">
          <Form.Item name="customerId" label="Khách có tài khoản">
            <Select allowClear showSearch={{ optionFilterProp: 'label' }} placeholder="Tìm khách" options={users.filter((u) => u.kind === 'CUSTOMER').map((u) => ({ value: u.id, label: `${u.fullName} · ${u.phone}` }))}
              onChange={(id) => { const u = users.find((x) => x.id === id); if (u) form.setFieldsValue({ guestName: u.fullName, guestPhone: u.phone }) }} />
          </Form.Item>
          <Form.Item name="guestName" label="Tên khách" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
          <Form.Item name="guestPhone" label="Số điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: 'Số điện thoại 10 số, bắt đầu bằng 0' }]}><Input inputMode="tel" /></Form.Item>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d.isBefore(dayjs(), 'day')} onChange={() => form.setFieldsValue({ slot: undefined, tableIds: [] })} /></Form.Item>
          <Form.Item name="slot" label="Giờ đến" rules={[{ required: true, message: 'Chọn giờ' }]}>
            <TimeSelect isPast={(s) => !!date && atSlot(date, s).isBefore(dayjs())} onChange={() => form.setFieldsValue({ tableIds: [] })} />
          </Form.Item>
          <Form.Item name="guestCount" label="Số khách" rules={[{ required: true }]}><InputNumber min={1} max={60} style={{ width: '100%' }} /></Form.Item>
        </div>
        <Form.Item name="tableIds" label={`Bàn (đã chọn ${seats}/${guests} chỗ)`} rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một bàn' }, { validator: () => (seats >= guests ? Promise.resolve() : Promise.reject(new Error('Chưa đủ chỗ cho số khách'))) }]}>
          {slot ? (
            <TablePicker multiple needSeats={guests} floors={floors} areas={areas} tables={tables}
              disabledReason={(t) => (tableConflict(reservations, t.id, atSlot(date, slot), value.id) ? 'Đã đặt' : null)} />
          ) : <span className="muted">Chọn giờ đến để xem bàn còn trống</span>}
        </Form.Item>
        <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} maxLength={300} /></Form.Item>
      </Form>
    </Modal>
  )
}
