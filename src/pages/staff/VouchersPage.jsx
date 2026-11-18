import { Button, DatePicker, Form, Input, InputNumber, Progress, Select, Switch, Table } from 'antd'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useCol } from '@/hooks/useApi'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { dayjs, fmtDate, matches, money } from '@/utils/format'

const STATE = { RUNNING: ['Đang chạy', 'green'], UPCOMING: ['Sắp chạy', 'blue'], EXPIRED: ['Hết hạn', 'default'], OFF: ['Đã tắt', 'red'], USED_UP: ['Hết lượt', 'gold'] }
const stateOf = (v) => (!v.isActive ? 'OFF' : dayjs().isAfter(v.endAt) ? 'EXPIRED' : dayjs().isBefore(v.startAt) ? 'UPCOMING' : v.usedCount >= v.usageLimit ? 'USED_UP' : 'RUNNING')

export default function VouchersPage() {
  const { data, isLoading } = useCol('vouchers')
  const crud = useCrud('vouchers', 'voucher')
  const [q, setQ] = useState('')
  const [state, setState] = useState()
  const [type, setType] = useState()
  const [range, setRange] = useState(null)
  const [editing, setEditing] = useState(null)
  const rows = data.filter((v) => matches(q, v.code, v.name) && (!state || stateOf(v) === state) && (!type || v.type === type)
    && (!range?.[0] || (dayjs(v.startAt).isBefore(range[1].endOf('day')) && dayjs(v.endAt).isAfter(range[0].startOf('day')))))

  return (
    <>
      <PageHeader title="Voucher" extra={<Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ type: 'PERCENT', isActive: true, usedCount: 0, usageLimit: 100, minOrderAmount: 0, period: [dayjs(), dayjs().add(30, 'day')] })}>Thêm voucher</Button>} />
      <Toolbar onReset={() => { setQ(''); setState(); setType(); setRange(null) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Mã, tên" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Trạng thái" value={state} onChange={setState} options={Object.entries(STATE).map(([value, [label]]) => ({ value, label }))} />
        <Select allowClear placeholder="Loại" value={type} onChange={setType} options={[{ value: 'PERCENT', label: 'Phần trăm' }, { value: 'FIXED', label: 'Số tiền' }]} />
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" placeholder={['Hiệu lực từ', 'đến']} />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 900 }} pagination={{ hideOnSinglePage: true, pageSize: 10 }} columns={[
        { title: 'Mã', dataIndex: 'code', render: (v) => <b>{v}</b> },
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Giảm', render: (_, v) => (v.type === 'PERCENT' ? `${v.value}%${v.maxDiscount ? `, tối đa ${money(v.maxDiscount)}` : ''}` : money(v.value)) },
        { title: 'Đơn tối thiểu', dataIndex: 'minOrderAmount', className: 'num', render: money },
        { title: 'Hiệu lực', render: (_, v) => `${fmtDate(v.startAt)} – ${fmtDate(v.endAt)}`, sorter: (a, b) => a.endAt.localeCompare(b.endAt) },
        { title: 'Đã dùng', width: 150, render: (_, v) => <Progress percent={Math.round((v.usedCount / v.usageLimit) * 100)} size="small" format={() => `${v.usedCount}/${v.usageLimit}`} /> },
        { title: 'Trạng thái', render: (_, v) => <StatusTag map={STATE} value={stateOf(v)} /> },
        { title: 'Bật', dataIndex: 'isActive', render: (on, v) => <Switch size="small" checked={on} aria-label="Bật voucher" onChange={(x) => crud.save(v, { isActive: x })} /> },
        { title: '', width: 90, render: (_, v) => <RowActions onEdit={() => setEditing({ ...v, period: [dayjs(v.startAt), dayjs(v.endAt)] })} onDelete={() => crud.remove(v.id)} /> },
      ]} />
      {editing && (
        <FormModal title="voucher" value={editing} width={640} onClose={() => setEditing(null)}
          onSubmit={({ period, ...v }) => crud.save(editing, { ...v, code: v.code.toUpperCase(), maxDiscount: v.maxDiscount || 0, startAt: period[0].startOf('day').toISOString(), endAt: period[1].endOf('day').toISOString(), usedCount: editing.usedCount ?? 0 })}>
          <div className="grid-2">
            <Form.Item name="code" label="Mã" rules={[{ required: true, pattern: /^[A-Za-z0-9]{3,20}$/, message: '3–20 chữ hoặc số, không dấu' }]}><Input style={{ textTransform: 'uppercase' }} /></Form.Item>
            <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
            <Form.Item name="type" label="Loại"><Select options={[{ value: 'PERCENT', label: 'Phần trăm' }, { value: 'FIXED', label: 'Số tiền' }]} /></Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
              {({ getFieldValue }) => (
                <Form.Item name="value" label={getFieldValue('type') === 'PERCENT' ? 'Giảm (%)' : 'Giảm (đ)'} rules={[{ required: true, message: 'Nhập mức giảm' }]}>
                  <InputNumber min={1} max={getFieldValue('type') === 'PERCENT' ? 100 : undefined} style={{ width: '100%' }} />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item name="maxDiscount" label="Giảm tối đa (đ)"><InputNumber min={0} step={10000} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="minOrderAmount" label="Đơn tối thiểu (đ)"><InputNumber min={0} step={50000} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="period" label="Hiệu lực" rules={[{ required: true, message: 'Chọn thời gian' }]}><DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="usageLimit" label="Số lượt" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name="isActive" label="Bật" valuePropName="checked"><Switch /></Form.Item>
        </FormModal>
      )}
    </>
  )
}
