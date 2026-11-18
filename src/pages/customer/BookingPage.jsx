import { useQuery } from '@tanstack/react-query'
import { Button, DatePicker, Form, Input, Result, Select } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useCustomer } from '@/stores/authStore'
import TablePicker, { TimeSelect } from '@/components/common/TablePicker'
import { atSlot, firstDay, LEAD_MINUTES, tableConflict } from '@/utils/booking'
import { dayjs, money } from '@/utils/format'

const VIP_MIN_GUESTS = 10
const GUEST_OPTIONS = Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: `${i + 1} khách` }))

export default function BookingPage() {
  const me = useCustomer()
  const nav = useNavigate()
  const [params] = useSearchParams() // ngày, giờ, số khách chọn sẵn từ thanh đặt bàn ở trang chủ
  const run = useRun()
  const { data: floors } = useCol('floors')
  const { data: areas } = useCol('areas')
  const { data: tables } = useCol('tables')
  const areaMap = byId(areas)
  const tmap = byId(tables)
  const [date, setDate] = useState(() => { const d = dayjs(params.get('date')); return params.get('date') && d.isValid() && !d.isBefore(firstDay(), 'day') ? d : firstDay() })
  const [guests, setGuests] = useState(() => Number(params.get('guests')) || 2)
  const [slot, setSlot] = useState(() => params.get('slot') ?? undefined)
  const [picked, setPicked] = useState([])
  const [done, setDone] = useState(null)
  const [form] = Form.useForm()
  // Khách không xem được lượt đặt của người khác: máy chủ chỉ trả bàn nào bận lúc nào trong ngày đã chọn
  const busy = useQuery({
    queryKey: ['availability', date.format('YYYY-MM-DD')],
    queryFn: () => api.availability(date.startOf('day').toISOString(), date.endOf('day').toISOString()),
  }).data ?? []
  const reservations = busy.map((b, i) => ({ id: i, status: 'CONFIRMED', tableIds: [b.tableId], time: b.time }))

  const vip = (t) => areaMap[t.areaId]?.type === 'VIP_ROOM'
  const free = (t, s, d = date) => t.isActive && !tableConflict(reservations, t.id, atSlot(d, s))
  const fullFor = (s, g) => tables.filter((t) => free(t, s) && (!vip(t) || g >= VIP_MIN_GUESTS)).reduce((n, t) => n + t.seats, 0) < g
  const seats = picked.reduce((s, id) => s + (tmap[id]?.seats || 0), 0)
  const vipArea = picked.map((id) => areaMap[tmap[id]?.areaId]).find((a) => a?.type === 'VIP_ROOM')

  const changeDate = (d) => { if (d) { setDate(d); setSlot(undefined); setPicked([]) } }
  const changeGuests = (g) => {
    setGuests(g)
    if (slot && fullFor(slot, g)) setSlot(undefined)
    if (g < VIP_MIN_GUESTS && picked.some((id) => vip(tmap[id]))) setPicked([])
  }

  const submit = (v) => run(() => api.create('reservations', {
    customerId: me?.id ?? null, guestName: v.name, guestPhone: v.phone, note: v.note || '', guestCount: guests,
    time: atSlot(date, slot).toISOString(), tableIds: picked,
  })).then(setDone, () => {})

  if (done) {
    return (
      <div className="wrap page">
        <Result status="success" title="Đã gửi yêu cầu đặt bàn" subTitle={`${dayjs(done.time).format('HH:mm, DD/MM/YYYY')} · ${done.guestCount} khách · bàn ${done.tableIds.map((id) => tmap[id]?.code).join(', ')}`}
          extra={[me && <Button key="a" type="primary" onClick={() => nav('/account?tab=reservations')}>Xem lượt đặt</Button>, <Button key="b" onClick={() => { setDone(null); setPicked([]); setSlot(undefined) }}>Đặt thêm</Button>]} />
      </div>
    )
  }

  return (
    <div className="wrap page">
      <h1 className="page-title">Đặt bàn</h1>
      <div className="booking">
        <div className="booking-steps">
          <div className="booking-bar">
            <label>Ngày
              <DatePicker value={date} onChange={changeDate} format="DD/MM/YYYY" allowClear={false} style={{ width: '100%' }} disabledDate={(d) => d.isBefore(firstDay(), 'day') || d.isAfter(dayjs().add(60, 'day'))} />
            </label>
            <label>Giờ đến
              <TimeSelect value={slot} onChange={(s) => { setSlot(s); setPicked([]) }} isPast={(s) => atSlot(date, s).isBefore(dayjs().add(LEAD_MINUTES, 'minute'))} disabledReason={(s) => (fullFor(s, guests) ? 'Hết chỗ' : null)} aria-label="Giờ đến" />
            </label>
            <label>Số khách
              <Select value={guests} onChange={changeGuests} options={GUEST_OPTIONS} aria-label="Số khách" />
            </label>
          </div>

          <section>
            <h2>Chọn bàn</h2>
            {slot ? (
              <TablePicker multiple needSeats={guests} floors={floors} areas={areas} tables={tables} value={picked} onChange={setPicked}
                disabledReason={(t) => (!free(t, slot) ? 'Đã đặt' : vip(t) && guests < VIP_MIN_GUESTS ? `Từ ${VIP_MIN_GUESTS} khách` : null)} />
            ) : <p className="muted">Chọn giờ đến để xem bàn còn trống.</p>}
          </section>

          <section>
            <h2>Thông tin liên hệ</h2>
            <Form form={form} layout="vertical" requiredMark={false} initialValues={{ name: me?.fullName, phone: me?.phone }} onFinish={submit}>
              <div className="grid-2">
                <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input autoComplete="name" /></Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: 'Số điện thoại 10 số, bắt đầu bằng 0' }]}><Input inputMode="tel" autoComplete="tel" /></Form.Item>
              </div>
              <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} maxLength={300} placeholder="Sinh nhật, có trẻ em" /></Form.Item>
            </Form>
          </section>
        </div>

        <aside className="card sticky">
          <h2 className="card-title">Lượt đặt của bạn</h2>
          <dl className="summary">
            <dt>Ngày</dt><dd>{date.format('DD/MM/YYYY')}</dd>
            <dt>Giờ</dt><dd>{slot ?? '—'}</dd>
            <dt>Số khách</dt><dd>{guests}</dd>
            <dt>Bàn</dt><dd>{picked.map((id) => tmap[id]?.code).join(', ') || '—'}</dd>
            <dt>Số chỗ</dt><dd>{seats}/{guests}</dd>
            {vipArea && <><dt>Phụ thu</dt><dd>{vipArea.serviceFeePercent}%</dd><dt>Chi tối thiểu</dt><dd>{money(vipArea.minSpend)}</dd></>}
          </dl>
          <Button type="primary" size="large" block disabled={!slot || seats < guests} loading={run.pending} onClick={form.submit}>Đặt bàn</Button>
        </aside>
      </div>
    </div>
  )
}
