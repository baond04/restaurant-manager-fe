import { Button, Form, Input, InputNumber, Modal, QRCode, Select, Switch, Table, Tag, Tooltip } from 'antd'
import { Layers, Plus, QrCode, RefreshCw, Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/services/api'
import { useCol } from '@/hooks/useApi'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { AREA_TYPE, SEAT_FILTERS, seatBucket, TABLE_STATUS, toOptions } from '@/constants'
import { matches, money } from '@/utils/format'

export default function FloorsPage() {
  const { data: floors } = useCol('floors')
  const { data: areas } = useCol('areas')
  const { data: tables } = useCol('tables')
  const floorCrud = useCrud('floors', 'tầng')
  const areaCrud = useCrud('areas', 'khu vực')
  const [areaId, setAreaId] = useState(1)
  const [editFloor, setEditFloor] = useState(null)
  const [editArea, setEditArea] = useState(null)
  const area = areas.find((a) => a.id === areaId) ?? areas[0]

  return (
    <>
      <PageHeader title="Tầng và bàn" extra={<Button icon={<Plus size={16} />} onClick={() => setEditFloor({ level: floors.length + 1, isActive: true })}>Thêm tầng</Button>} />
      <div className="split">
        <nav className="card tree" aria-label="Tầng và khu vực">
          {[...floors].sort((a, b) => a.level - b.level).map((f) => (
            <div key={f.id}>
              <div className="tree-floor">
                <Layers size={16} aria-hidden="true" /><b>{f.name}</b>{!f.isActive && <Tag>Ngừng</Tag>}
                <RowActions onEdit={() => setEditFloor(f)} onDelete={() => floorCrud.remove(f.id)}
                  extra={<Tooltip title="Thêm khu vực"><Button type="text" size="small" aria-label="Thêm khu vực" icon={<Plus size={16} />} onClick={() => setEditArea({ floorId: f.id, type: 'HALL', serviceFeePercent: 0, minSpend: 0, isActive: true })} /></Tooltip>} />
              </div>
              {areas.filter((a) => a.floorId === f.id).map((a) => (
                <button type="button" key={a.id} className="tree-area" aria-current={a.id === area?.id} onClick={() => setAreaId(a.id)}>
                  <span>{a.name}</span><span className="muted">{tables.filter((t) => t.areaId === a.id).length} bàn</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <section>
          {area && (
            <div className="row-gap" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16 }}>{area.name}</h2>
              <Tag>{AREA_TYPE[area.type]}</Tag>
              {area.serviceFeePercent > 0 && <span>Phụ thu {area.serviceFeePercent}%</span>}
              {area.minSpend > 0 && <span>Chi tối thiểu {money(area.minSpend)}</span>}
              {!area.isActive && <Tag>Ngừng dùng</Tag>}
              <div style={{ flex: 1 }} />
              <RowActions onEdit={() => setEditArea(area)} onDelete={() => areaCrud.remove(area.id)} />
            </div>
          )}
          {area && <AreaTables area={area} />}
        </section>
      </div>

      {editFloor && (
        <FormModal title="tầng" value={editFloor} onClose={() => setEditFloor(null)} onSubmit={(v) => floorCrud.save(editFloor, v)}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="Tầng 4" /></Form.Item>
          <Form.Item name="level" label="Thứ tự tầng" rules={[{ required: true }]}><InputNumber min={0} /></Form.Item>
          <Form.Item name="isActive" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item>
        </FormModal>
      )}
      {editArea && (
        <FormModal title="khu vực" value={editArea} onClose={() => setEditArea(null)} onSubmit={(v) => areaCrud.save(editArea, v)}>
          {(form) => (
            <>
              <div className="grid-2">
                <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input /></Form.Item>
                <Form.Item name="floorId" label="Tầng" rules={[{ required: true }]}><Select options={floors.map((f) => ({ value: f.id, label: f.name }))} /></Form.Item>
                <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                  <Select options={toOptions(AREA_TYPE)} onChange={(t) => t !== 'VIP_ROOM' && form.setFieldsValue({ serviceFeePercent: 0, minSpend: 0 })} />
                </Form.Item>
                <Form.Item name="isActive" label="Đang dùng" valuePropName="checked"><Switch /></Form.Item>
              </div>
              <Form.Item noStyle shouldUpdate={(a, b) => a.type !== b.type}>
                {({ getFieldValue }) => getFieldValue('type') === 'VIP_ROOM' && (
                  <div className="grid-2">
                    <Form.Item name="serviceFeePercent" label="Phụ thu (%)"><InputNumber min={0} max={30} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="minSpend" label="Chi tối thiểu (đ)"><InputNumber min={0} step={500000} style={{ width: '100%' }} /></Form.Item>
                  </div>
                )}
              </Form.Item>
            </>
          )}
        </FormModal>
      )}
    </>
  )
}

function AreaTables({ area }) {
  const { data: all } = useCol('tables')
  const { data: areas } = useCol('areas')
  const crud = useCrud('tables', 'bàn')
  const [q, setQ] = useState('')
  const [seats, setSeats] = useState()
  const [status, setStatus] = useState()
  const [editing, setEditing] = useState(null)
  const [bulk, setBulk] = useState(null)
  const [qr, setQr] = useState(null)
  const rows = all.filter((t) => t.areaId === area.id && matches(q, t.code) && (!seats || seatBucket(t.seats) === seats) && (!status || t.status === status))
  return (
    <>
      <Toolbar onReset={() => { setQ(''); setSeats(); setStatus() }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Mã bàn" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Số chỗ" value={seats} onChange={setSeats} options={SEAT_FILTERS.map(([v, l]) => ({ value: v, label: l }))} />
        <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={toOptions(TABLE_STATUS)} />
        <div style={{ flex: 1 }} />
        <Button onClick={() => setBulk({ areaId: area.id, prefix: '', from: 1, count: 4, seats: 4 })}>Thêm hàng loạt</Button>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ areaId: area.id, seats: 4, status: 'AVAILABLE', isActive: true })}>Thêm bàn</Button>
      </Toolbar>
      <Table rowKey="id" dataSource={rows} pagination={{ hideOnSinglePage: true, pageSize: 10 }} columns={[
        { title: 'Mã bàn', dataIndex: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
        { title: 'Số chỗ', dataIndex: 'seats', className: 'num', sorter: (a, b) => a.seats - b.seats },
        { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag map={TABLE_STATUS} value={v} /> },
        { title: 'Đang dùng', dataIndex: 'isActive', render: (v, t) => <Switch size="small" checked={v} aria-label="Đang dùng" onChange={(on) => crud.save(t, { isActive: on, status: on ? 'AVAILABLE' : 'DISABLED' })} disabled={t.status === 'OCCUPIED'} /> },
        { title: '', width: 130, render: (_, t) => <RowActions onEdit={() => setEditing(t)} onDelete={() => crud.remove(t.id)}
          extra={<Tooltip title="Mã QR"><Button type="text" size="small" aria-label="Mã QR" icon={<QrCode size={16} />} onClick={() => setQr(t)} /></Tooltip>} /> },
      ]} />
      {editing && (
        <FormModal title="bàn" value={editing} onClose={() => setEditing(null)} onSubmit={(v, isNew) => crud.save(editing, isNew ? { ...v, qrToken: Math.random().toString(36).slice(2, 12) } : v)}>
          <div className="grid-2">
            <Form.Item name="code" label="Mã bàn" rules={[{ required: true, message: 'Nhập mã' }]}><Input /></Form.Item>
            <Form.Item name="seats" label="Số chỗ" rules={[{ required: true }]}><InputNumber min={1} max={40} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="areaId" label="Khu vực"><Select options={areas.map((a) => ({ value: a.id, label: a.name }))} /></Form.Item>
          </div>
        </FormModal>
      )}
      {bulk && (
        <FormModal title="nhiều bàn" value={bulk} onClose={() => setBulk(null)} onSubmit={(v) => crud.run(() => api.bulkAddTables({ ...v, areaId: area.id }), `Đã thêm ${v.count} bàn`)}>
          {(form) => (
            <>
              <div className="grid-2">
                <Form.Item name="prefix" label="Tiền tố" rules={[{ required: true, message: 'Ví dụ A' }]}><Input placeholder="A" /></Form.Item>
                <Form.Item name="from" label="Bắt đầu từ số"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="count" label="Số bàn"><InputNumber min={1} max={50} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="seats" label="Số chỗ mỗi bàn"><InputNumber min={1} max={40} style={{ width: '100%' }} /></Form.Item>
              </div>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const { prefix = '', from = 1, count = 0 } = form.getFieldsValue()
                  return count > 0 && prefix && <p className="muted">Sẽ tạo {prefix}{String(from).padStart(2, '0')} đến {prefix}{String(from + count - 1).padStart(2, '0')}</p>
                }}
              </Form.Item>
            </>
          )}
        </FormModal>
      )}
      <Modal open={!!qr} title={qr && `Mã QR bàn ${qr.code}`} footer={null} onCancel={() => setQr(null)} width={320}>
        {qr && (
          <div style={{ textAlign: 'center' }}>
            <QRCode value={`${window.location.origin}/t/${all.find((t) => t.id === qr.id)?.qrToken}`} size={200} style={{ margin: '0 auto 12px' }} />
            <Button icon={<RefreshCw size={16} />} onClick={() => crud.run(() => api.regenerateQr(qr.id), 'Đã đổi mã QR, mã cũ hết hiệu lực')}>Đổi mã QR</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
