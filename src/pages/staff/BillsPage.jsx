import { Button, DatePicker, Descriptions, Drawer, Input, InputNumber, Modal, Popconfirm, Radio, Select, Table, Tabs } from 'antd'
import { Printer, Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { PageHeader, StatusTag, Toolbar } from '@/components/common/ui'
import { BILL_STATUS, PAY_METHOD, SOURCE, toOptions } from '@/constants'
import { calcBill, voucherDiscount } from '@/utils/billing'
import { dayjs, fmtDateTime, inRange, matches, minutesSince, money } from '@/utils/format'

export default function BillsPage() {
  const [params, setParams] = useSearchParams()
  const payId = params.get('pay') ? +params.get('pay') : null
  const [tab, setTab] = useState('open')
  return (
    <>
      <PageHeader title="Hóa đơn" />
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'open', label: 'Chưa thanh toán', children: <OpenOrders onPay={(id) => setParams({ pay: id })} /> },
        { key: 'paid', label: 'Lịch sử hóa đơn', children: <BillHistory /> },
      ]} />
      {payId && <PayModal orderId={payId} onClose={() => setParams({})} />}
    </>
  )
}

function OpenOrders({ onPay }) {
  const { can } = useStaff()
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const tables = byId(useCol('tables').data)
  const [q, setQ] = useState('')
  const data = orders.filter((o) => o.status === 'OPEN' && matches(q, tables[o.tableId]?.code ?? 'mang đi')).map((o) => {
    const ol = lines.filter((l) => l.orderId === o.id && l.status !== 'CANCELLED')
    return { ...o, count: ol.reduce((s, l) => s + l.qty, 0), subtotal: ol.reduce((s, l) => s + l.qty * l.unitPrice, 0), waiting: ol.some((l) => ['PENDING', 'COOKING'].includes(l.status)) }
  })
  return (
    <>
      <Toolbar><Input allowClear prefix={<Search size={16} />} placeholder="Tìm bàn" value={q} onChange={(e) => setQ(e.target.value)} /></Toolbar>
      <Table rowKey="id" dataSource={data} pagination={false} scroll={{ x: 640 }} columns={[
        { title: 'Bàn', render: (_, o) => <b>{tables[o.tableId]?.code ?? 'Mang đi'}</b> },
        { title: 'Vào lúc', dataIndex: 'openedAt', render: (v) => `${fmtDateTime(v)} (${minutesSince(v)} phút)` },
        { title: 'Số món', dataIndex: 'count', className: 'num' },
        { title: 'Tạm tính', dataIndex: 'subtotal', className: 'num', render: money, sorter: (a, b) => a.subtotal - b.subtotal },
        { title: '', render: (_, o) => can('bill:pay') && <Button type="primary" disabled={o.waiting || !o.count} title={o.waiting ? 'Còn món chưa nấu xong' : !o.count ? 'Chưa có món' : undefined} onClick={() => onPay(o.id)}>Thanh toán</Button> },
      ]} />
    </>
  )
}

function BillHistory() {
  const { can } = useStaff()
  const run = useRun()
  const { data: bills, isLoading } = useCol('bills')
  const { data: users } = useCol('users')
  const orders = byId(useCol('orders').data)
  const tables = byId(useCol('tables').data)
  const vouchers = byId(useCol('vouchers').data)
  const umap = byId(users)
  const [q, setQ] = useState('')
  const [range, setRange] = useState([dayjs().subtract(6, 'day'), dayjs()])
  const [method, setMethod] = useState()
  const [status, setStatus] = useState()
  const [cashier, setCashier] = useState()
  const [detail, setDetail] = useState(null)

  const data = bills.filter((b) => inRange(b.paidAt, range) && (!method || b.method === method) && (!status || b.status === status) && (!cashier || b.cashierId === cashier)
    && matches(q, `HD${b.id}`, tables[orders[b.orderId]?.tableId]?.code)).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  const paid = data.filter((b) => b.status === 'PAID')

  return (
    <>
      <Toolbar onReset={() => { setQ(''); setMethod(); setStatus(); setCashier(); setRange([dayjs().subtract(6, 'day'), dayjs()]) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Mã hóa đơn, bàn" value={q} onChange={(e) => setQ(e.target.value)} />
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" allowClear={false} presets={[
          { label: 'Hôm nay', value: [dayjs(), dayjs()] }, { label: '7 ngày', value: [dayjs().subtract(6, 'day'), dayjs()] },
          { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs()] }, { label: 'Tháng trước', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
        ]} />
        <Select allowClear placeholder="Phương thức" value={method} onChange={setMethod} options={toOptions(PAY_METHOD)} />
        <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={toOptions(BILL_STATUS).filter((o) => o.value !== 'OPEN')} />
        <Select allowClear placeholder="Thu ngân" value={cashier} onChange={setCashier} options={users.filter((u) => u.roleId === 3).map((u) => ({ value: u.id, label: u.fullName }))} />
      </Toolbar>
      <p className="muted">{paid.length} hóa đơn · doanh thu {money(paid.reduce((s, b) => s + b.total, 0))}</p>
      <Table rowKey="id" loading={isLoading} dataSource={data} scroll={{ x: 900 }} rowClassName="clickable-row" onRow={(b) => ({ onClick: () => setDetail(b) })}
        pagination={{ hideOnSinglePage: true, pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n} hóa đơn` }} columns={[
          { title: 'Mã', dataIndex: 'id', render: (v) => `HD${v}` },
          { title: 'Thời gian', dataIndex: 'paidAt', render: fmtDateTime, sorter: (a, b) => a.paidAt.localeCompare(b.paidAt) },
          { title: 'Bàn', render: (_, b) => tables[orders[b.orderId]?.tableId]?.code ?? 'Mang đi' },
          { title: 'Voucher', render: (_, b) => vouchers[b.voucherId]?.code },
          { title: 'Phương thức', dataIndex: 'method', render: (v) => PAY_METHOD[v] },
          { title: 'Thu ngân', render: (_, b) => umap[b.cashierId]?.fullName },
          { title: 'Tổng', dataIndex: 'total', className: 'num', render: money, sorter: (a, b) => a.total - b.total },
          { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag map={BILL_STATUS} value={v} /> },
        ]} />
      <BillDrawer bill={detail} onClose={() => setDetail(null)} canVoid={can('bill:void')} onVoid={(id) => run(() => api.voidBill(id), 'Đã hủy hóa đơn').then(() => setDetail(null))} />
    </>
  )
}

function BillDrawer({ bill, onClose, canVoid, onVoid }) {
  const { data: lines } = useCol('orderItems')
  const items = byId(useCol('items').data)
  if (!bill) return null
  const ol = lines.filter((l) => l.orderId === bill.orderId && l.status !== 'CANCELLED')
  return (
    <Drawer open onClose={onClose} title={`Hóa đơn HD${bill.id}`} size={440} extra={<StatusTag map={BILL_STATUS} value={bill.status} />}>
      <div className="bill-print">
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Nhà Hàng Cam · HD{bill.id}</h2>
      <Table size="small" rowKey="id" pagination={false} dataSource={ol} columns={[
        { title: 'Món', render: (_, l) => <>{items[l.itemId]?.name}<div className="muted no-print">{SOURCE[l.source]}</div></> },
        { title: 'SL', dataIndex: 'qty', className: 'num' },
        { title: 'Thành tiền', className: 'num', render: (_, l) => money(l.qty * l.unitPrice) },
      ]} />
      <Breakdown b={bill} />
      </div>
      <Button block icon={<Printer size={16} />} onClick={() => window.print()} style={{ marginTop: 16 }}>In hóa đơn</Button>
      {canVoid && bill.status === 'PAID' && (
        <Popconfirm title="Hủy hóa đơn này?" okText="Hủy hóa đơn" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => onVoid(bill.id)}>
          <Button block danger style={{ marginTop: 8 }}>Hủy hóa đơn</Button>
        </Popconfirm>
      )}
    </Drawer>
  )
}

function Breakdown({ b }) {
  const rows = [['Tạm tính', b.subtotal], ['Phụ thu khu vực', b.serviceFee], ['Bù mức chi tối thiểu', b.minSpendTopUp], ['Voucher', -b.discount], ['Điểm', -b.pointsAmount], ['VAT 8%', b.tax]]
  return (
    <Descriptions column={1} size="small" style={{ marginTop: 12 }} items={[
      ...rows.filter(([, v]) => v).map(([label, v]) => ({ label, children: <span className="num">{money(v)}</span> })),
      { label: <b>Tổng cộng</b>, children: <b className="num">{money(b.total)}</b> },
    ]} />
  )
}

function PayModal({ orderId, onClose }) {
  const { user, can } = useStaff()
  const run = useRun()
  const { data: orders } = useCol('orders')
  const { data: lines } = useCol('orderItems')
  const { data: vouchers } = useCol('vouchers')
  const tables = byId(useCol('tables').data)
  const areas = byId(useCol('areas').data)
  const users = byId(useCol('users').data)
  const items = byId(useCol('items').data)
  const [voucherId, setVoucherId] = useState()
  const [points, setPoints] = useState(0)
  const [method, setMethod] = useState('CASH')
  const o = orders.find((x) => x.id === orderId)
  if (!o) return null
  const ol = lines.filter((l) => l.orderId === orderId && l.status !== 'CANCELLED')
  const area = areas[tables[o.tableId]?.areaId]
  const customer = users[o.customerId]
  const voucher = vouchers.find((v) => v.id === voucherId)
  const b = calcBill({ lines: ol, area, voucher, pointsUsed: points })
  const subtotal = b.subtotal

  return (
    <Modal open title={`Thanh toán ${tables[o.tableId] ? `bàn ${tables[o.tableId].code}` : 'đơn mang đi'}`} okText={`Thu ${money(b.total)}`} cancelText="Đóng" width={560}
      onCancel={onClose} confirmLoading={run.pending} okButtonProps={{ disabled: o.status !== 'OPEN' }}
      onOk={() => run(() => api.payBill(orderId, { voucherId, pointsUsed: points, method, cashierId: user.id }), 'Đã thanh toán').then(onClose)}>
      <Table size="small" rowKey="id" pagination={false} dataSource={ol} columns={[
        { title: 'Món', render: (_, l) => items[l.itemId]?.name },
        { title: 'SL', dataIndex: 'qty', className: 'num' },
        { title: 'Thành tiền', className: 'num', render: (_, l) => money(l.qty * l.unitPrice) },
      ]} />
      {can('bill:discount') && (
        <div className="grid-2" style={{ marginTop: 12 }}>
          <Select allowClear placeholder="Voucher" value={voucherId} onChange={setVoucherId} options={vouchers.filter((v) => v.isActive).map((v) => {
            const d = voucherDiscount(v, subtotal)
            return { value: v.id, label: `${v.code} · ${d ? `-${money(d)}` : 'không áp dụng'}`, disabled: !d }
          })} />
          <InputNumber min={0} max={customer?.points || 0} disabled={!customer} value={points} onChange={(v) => setPoints(v || 0)} style={{ width: '100%' }}
            placeholder="Dùng điểm" suffix={customer ? `/ ${customer.points} điểm` : 'Khách lẻ'} />
        </div>
      )}
      <Breakdown b={b} />
      <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)} optionType="button" buttonStyle="solid" options={toOptions(PAY_METHOD)} style={{ marginTop: 12 }} />
    </Modal>
  )
}
