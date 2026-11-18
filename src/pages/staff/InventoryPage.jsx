import { Button, DatePicker, Form, Input, InputNumber, Select, Table, Tabs } from 'antd'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { TX_TYPE, toOptions } from '@/constants'
import { dayjs, fmtDateTime, inRange, matches, money } from '@/utils/format'

export default function InventoryPage() {
  return (
    <>
      <PageHeader title="Kho nguyên liệu" />
      <Tabs destroyOnHidden items={[
        { key: 'ing', label: 'Nguyên liệu', children: <IngredientsTab /> },
        { key: 'tx', label: 'Phiếu nhập, xuất', children: <TxTab /> },
      ]} />
    </>
  )
}

function IngredientsTab() {
  const { can } = useStaff()
  const write = can('inventory:write')
  const { data, isLoading } = useCol('ingredients')
  const crud = useCrud('ingredients', 'nguyên liệu')
  const [q, setQ] = useState('')
  const [low, setLow] = useState()
  const [unit, setUnit] = useState()
  const [editing, setEditing] = useState(null)
  const units = [...new Set(data.map((g) => g.unit))]
  const rows = data.filter((g) => matches(q, g.name) && (low === undefined || (g.stock < g.minStock) === low) && (!unit || g.unit === unit))
  return (
    <>
      <Toolbar onReset={() => { setQ(''); setLow(); setUnit() }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tìm nguyên liệu" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Mức tồn" value={low} onChange={setLow} options={[{ value: true, label: 'Dưới mức tối thiểu' }, { value: false, label: 'Đủ' }]} />
        <Select allowClear placeholder="Đơn vị" value={unit} onChange={setUnit} options={units.map((u) => ({ value: u, label: u }))} />
        <div style={{ flex: 1 }} />
        {write && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ stock: 0, minStock: 1 })}>Thêm nguyên liệu</Button>}
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} nguyên liệu` }} scroll={{ x: 760 }} columns={[
        { title: 'Tên', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Đơn vị', dataIndex: 'unit' },
        { title: 'Tồn', dataIndex: 'stock', className: 'num', sorter: (a, b) => a.stock / a.minStock - b.stock / b.minStock, render: (v, g) => <span className={v < g.minStock ? 'text-bad' : ''}>{v}{v < g.minStock && ' (thiếu)'}</span> },
        { title: 'Tối thiểu', dataIndex: 'minStock', className: 'num' },
        { title: 'Giá nhập', dataIndex: 'cost', className: 'num', render: money },
        { title: 'Giá trị tồn', className: 'num', render: (_, g) => money(g.stock * g.cost), sorter: (a, b) => a.stock * a.cost - b.stock * b.cost },
        write && { title: '', width: 90, render: (_, g) => <RowActions onEdit={() => setEditing(g)} onDelete={() => crud.remove(g.id)} /> },
      ].filter(Boolean)} />
      {editing && (
        <FormModal title="nguyên liệu" value={editing} onClose={() => setEditing(null)} onSubmit={(v) => crud.save(editing, v)}>
          <div className="grid-2">
            <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
            <Form.Item name="unit" label="Đơn vị" rules={[{ required: true, message: 'Nhập đơn vị' }]}><Input placeholder="kg, lít, chai" /></Form.Item>
            {!editing.id && <Form.Item name="stock" label="Tồn ban đầu"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>}
            <Form.Item name="minStock" label="Mức tối thiểu" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="cost" label="Giá nhập (đ/đơn vị)" rules={[{ required: true }]}><InputNumber min={0} step={1000} style={{ width: '100%' }} /></Form.Item>
          </div>
        </FormModal>
      )}
    </>
  )
}

function TxTab() {
  const { user, can } = useStaff()
  const { data: txs, isLoading } = useCol('inventoryTx')
  const { data: ings } = useCol('ingredients')
  const ingMap = byId(ings)
  const users = byId(useCol('users').data)
  const crud = useCrud('inventoryTx', 'phiếu')
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()])
  const [type, setType] = useState()
  const [ing, setIng] = useState()
  const [adding, setAdding] = useState(null)
  const rows = txs.filter((t) => inRange(t.createdAt, range) && (!type || t.type === type) && (!ing || t.ingredientId === ing)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <>
      <Toolbar onReset={() => { setType(); setIng(); setRange([dayjs().subtract(29, 'day'), dayjs()]) }}>
        <DatePicker.RangePicker value={range} onChange={setRange} format="DD/MM/YYYY" allowClear={false} />
        <Select allowClear placeholder="Loại phiếu" value={type} onChange={setType} options={toOptions(TX_TYPE)} />
        <Select allowClear showSearch={{ optionFilterProp: 'label' }} placeholder="Nguyên liệu" value={ing} onChange={setIng} options={ings.map((g) => ({ value: g.id, label: g.name }))} />
        <div style={{ flex: 1 }} />
        {can('inventory:write') && <Button type="primary" icon={<Plus size={16} />} onClick={() => setAdding({ type: 'IMPORT' })}>Tạo phiếu</Button>}
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} phiếu` }} scroll={{ x: 760 }} columns={[
        { title: 'Thời gian', dataIndex: 'createdAt', render: fmtDateTime },
        { title: 'Loại', dataIndex: 'type', render: (v) => <StatusTag map={TX_TYPE} value={v} /> },
        { title: 'Nguyên liệu', render: (_, t) => ingMap[t.ingredientId]?.name },
        { title: 'Số lượng', className: 'num', render: (_, t) => `${t.type === 'IMPORT' || (t.type === 'ADJUST' && t.qty > 0) ? '+' : t.type === 'ADJUST' ? '' : '-'}${t.qty} ${ingMap[t.ingredientId]?.unit ?? ''}` },
        { title: 'Thành tiền', className: 'num', render: (_, t) => money(Math.abs(t.qty) * t.unitCost) },
        { title: 'Ghi chú', dataIndex: 'note' },
        { title: 'Người lập', render: (_, t) => users[t.employeeId]?.fullName ?? 'Hệ thống' },
      ]} />
      {adding && (
        <FormModal title="phiếu kho" value={adding} onClose={() => setAdding(null)}
          onSubmit={(v) => crud.save(null, { ...v, unitCost: ingMap[v.ingredientId].cost, employeeId: user.id }, true)}>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}><Select options={toOptions(TX_TYPE).filter((o) => o.value !== 'CONSUME')} /></Form.Item>
          <Form.Item name="ingredientId" label="Nguyên liệu" rules={[{ required: true, message: 'Chọn nguyên liệu' }]}>
            <Select showSearch={{ optionFilterProp: 'label' }} options={ings.map((g) => ({ value: g.id, label: `${g.name} (tồn ${g.stock} ${g.unit})` }))} />
          </Form.Item>
          <Form.Item name="qty" label="Số lượng (điều chỉnh: số âm để giảm)" rules={[{ required: true, message: 'Nhập số lượng' }, ({ getFieldValue }) => ({ validator: (_, v) => (getFieldValue('type') !== 'ADJUST' && v <= 0 ? Promise.reject(new Error('Số lượng phải lớn hơn 0')) : Promise.resolve()) })]}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="note" label="Ghi chú"><Input /></Form.Item>
        </FormModal>
      )}
    </>
  )
}
