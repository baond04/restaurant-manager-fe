import { Button, Form, Input, InputNumber, Select, Space, Switch, Table, Tabs, Tag } from 'antd'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import FormModal, { useCrud } from '@/components/common/FormModal'
import ImageInput from '@/components/common/ImageInput'
import { ItemThumb, PageHeader, RowActions, Toolbar } from '@/components/common/ui'
import { TAG_TYPE, toOptions } from '@/constants'
import { matches, money } from '@/utils/format'

const PRICE_RANGES = [[0, 50000, 'Dưới 50.000đ'], [50000, 100000, '50.000–100.000đ'], [100000, 200000, '100.000–200.000đ'], [200000, Infinity, 'Trên 200.000đ']]

export default function MenuPage() {
  const [tab, setTab] = useState('items')
  return (
    <>
      <PageHeader title="Thực đơn" />
      <Tabs activeKey={tab} onChange={setTab} destroyOnHidden items={[
        { key: 'items', label: 'Món ăn', children: <ItemsTab /> },
        { key: 'cats', label: 'Danh mục', children: <CategoriesTab /> },
        { key: 'tags', label: 'Tag', children: <TagsTab /> },
      ]} />
    </>
  )
}

function ItemsTab() {
  const { can } = useStaff()
  const write = can('menu:write')
  const { data: items, isLoading } = useCol('items')
  const { data: cats } = useCol('categories')
  const { data: tags } = useCol('tags')
  const { data: ingredients } = useCol('ingredients')
  const catMap = byId(cats), tagMap = byId(tags)
  const crud = useCrud('items', 'món')
  const [f, setF] = useState({ q: '', cats: [], tag: undefined, avail: undefined, price: undefined })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const [editing, setEditing] = useState(null)

  const data = items.filter((i) => matches(f.q, i.name) && (!f.cats.length || f.cats.includes(i.categoryId)) && (!f.tag || i.tagIds.includes(f.tag))
    && (f.avail === undefined || i.isAvailable === f.avail) && (f.price === undefined || (i.price >= PRICE_RANGES[f.price][0] && i.price < PRICE_RANGES[f.price][1])))

  return (
    <>
      <Toolbar onReset={() => setF({ q: '', cats: [], tag: undefined, avail: undefined, price: undefined })}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tìm món" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <Select mode="multiple" allowClear placeholder="Danh mục" value={f.cats} onChange={(v) => set({ cats: v })} options={cats.map((c) => ({ value: c.id, label: c.name }))} style={{ minWidth: 200 }} />
        <Select allowClear showSearch={{ optionFilterProp: 'label' }} placeholder="Tag" value={f.tag} onChange={(v) => set({ tag: v })} options={tags.map((t) => ({ value: t.id, label: t.name }))} />
        <Select allowClear placeholder="Giá" value={f.price} onChange={(v) => set({ price: v })} options={PRICE_RANGES.map(([, , l], i) => ({ value: i, label: l }))} />
        <Select allowClear placeholder="Tình trạng" value={f.avail} onChange={(v) => set({ avail: v })} options={[{ value: true, label: 'Còn món' }, { value: false, label: 'Hết món' }]} />
        <div style={{ flex: 1 }} />
        {write && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ isAvailable: true, tagIds: [], recipe: [], prepMinutes: 10 })}>Thêm món</Button>}
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={data} scroll={{ x: 900 }} pagination={{ hideOnSinglePage: true, pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n} món` }} columns={[
        { title: 'Món', render: (_, i) => <Space><ItemThumb item={i} size={40} /><b>{i.name}</b></Space>, sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Danh mục', render: (_, i) => catMap[i.categoryId]?.name },
        { title: 'Giá', dataIndex: 'price', className: 'num', render: money, sorter: (a, b) => a.price - b.price },
        { title: 'Tag', render: (_, i) => i.tagIds.map((t) => <Tag key={t}>{tagMap[t]?.name}</Tag>) },
        { title: 'Thời gian làm', dataIndex: 'prepMinutes', className: 'num', render: (v) => `${v} phút` },
        { title: 'Còn món', dataIndex: 'isAvailable', render: (v, i) => <Switch size="small" checked={v} disabled={!write} onChange={(on) => crud.save(i, { isAvailable: on })} aria-label="Còn món" /> },
        write && { title: '', width: 90, render: (_, i) => <RowActions onEdit={() => setEditing(i)} onDelete={() => crud.remove(i.id)} deleteTitle={`Xóa ${i.name}? Hóa đơn cũ vẫn giữ món này.`} /> },
      ].filter(Boolean)} />

      {editing && (
        <FormModal title="món" value={editing} width={720} onClose={() => setEditing(null)} onSubmit={(v) => crud.save(editing, { ...v, recipe: v.recipe || [] })}>
          <div className="grid-2">
            <Form.Item name="name" label="Tên món" rules={[{ required: true, message: 'Nhập tên món' }]}><Input maxLength={120} /></Form.Item>
            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Chọn danh mục' }]}><Select options={cats.map((c) => ({ value: c.id, label: c.name }))} /></Form.Item>
            <Form.Item name="price" label="Giá (đ)" rules={[{ required: true, message: 'Nhập giá' }]}><InputNumber min={0} step={5000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v.replace(/\./g, '')} /></Form.Item>
            <Form.Item name="prepMinutes" label="Thời gian làm (phút)"><InputNumber min={1} max={120} style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name="tagIds" label="Tag"><Select mode="multiple" options={tags.map((t) => ({ value: t.id, label: t.name }))} /></Form.Item>
          <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} maxLength={500} /></Form.Item>
          <Form.Item name="image" label="Ảnh món"><ImageInput /></Form.Item>
          <Form.Item label="Công thức">
            <Form.List name="recipe">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} align="baseline" style={{ display: 'flex' }}>
                      <Form.Item name={[name, 'ingredientId']} rules={[{ required: true, message: 'Chọn' }]}><Select style={{ width: 220 }} placeholder="Nguyên liệu" options={ingredients.map((g) => ({ value: g.id, label: `${g.name} (${g.unit})` }))} /></Form.Item>
                      <Form.Item name={[name, 'qty']} rules={[{ required: true, message: 'Nhập' }]}><InputNumber min={0.001} step={0.01} placeholder="Lượng" /></Form.Item>
                      <Button type="text" danger aria-label="Bỏ dòng" icon={<Trash2 size={16} />} onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<Plus size={16} />}>Thêm nguyên liệu</Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item name="isAvailable" label="Còn món" valuePropName="checked"><Switch /></Form.Item>
        </FormModal>
      )}
    </>
  )
}

function CategoriesTab() {
  const { can } = useStaff()
  const write = can('menu:write')
  const { data: cats } = useCol('categories')
  const { data: items } = useCol('items')
  const crud = useCrud('categories', 'danh mục')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  return (
    <>
      <Toolbar>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tìm danh mục" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ flex: 1 }} />
        {write && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ isActive: true, sortOrder: cats.length + 1 })}>Thêm danh mục</Button>}
      </Toolbar>
      <Table rowKey="id" dataSource={cats.filter((c) => matches(q, c.name)).sort((a, b) => a.sortOrder - b.sortOrder)} pagination={false} columns={[
        { title: 'Thứ tự', dataIndex: 'sortOrder', width: 90, className: 'num' },
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Số món', className: 'num', render: (_, c) => items.filter((i) => i.categoryId === c.id).length },
        { title: 'Hiện cho khách', dataIndex: 'isActive', render: (v, c) => <Switch size="small" checked={v} disabled={!write} onChange={(on) => crud.save(c, { isActive: on })} aria-label="Hiện cho khách" /> },
        write && { title: '', width: 90, render: (_, c) => <RowActions onEdit={() => setEditing(c)} onDelete={() => crud.remove(c.id)} /> },
      ].filter(Boolean)} />
      {editing && (
        <FormModal title="danh mục" value={editing} onClose={() => setEditing(null)} onSubmit={(v) => crud.save(editing, v)}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input maxLength={60} /></Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự"><InputNumber min={1} /></Form.Item>
          <Form.Item name="isActive" label="Hiện cho khách" valuePropName="checked"><Switch /></Form.Item>
        </FormModal>
      )}
    </>
  )
}

function TagsTab() {
  const { can } = useStaff()
  const write = can('menu:write')
  const { data: tags } = useCol('tags')
  const { data: items } = useCol('items')
  const crud = useCrud('tags', 'tag')
  const [q, setQ] = useState('')
  const [type, setType] = useState()
  const [editing, setEditing] = useState(null)
  return (
    <>
      <Toolbar>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tìm tag" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Loại" value={type} onChange={setType} options={toOptions(TAG_TYPE)} />
        <div style={{ flex: 1 }} />
        {write && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ type: 'TASTE' })}>Thêm tag</Button>}
      </Toolbar>
      <Table rowKey="id" dataSource={tags.filter((t) => matches(q, t.name) && (!type || t.type === type))} pagination={{ hideOnSinglePage: true, pageSize: 10 }} columns={[
        { title: 'Tên', dataIndex: 'name' },
        { title: 'Loại', dataIndex: 'type', render: (v) => TAG_TYPE[v] },
        { title: 'Số món', className: 'num', render: (_, t) => items.filter((i) => i.tagIds.includes(t.id)).length },
        write && { title: '', width: 90, render: (_, t) => <RowActions onEdit={() => setEditing(t)} onDelete={() => crud.remove(t.id)} deleteTitle="Xóa tag và gỡ khỏi các món?" /> },
      ].filter(Boolean)} />
      {editing && (
        <FormModal title="tag" value={editing} onClose={() => setEditing(null)} onSubmit={(v) => crud.save(editing, v)}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input maxLength={40} /></Form.Item>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}><Select options={toOptions(TAG_TYPE)} /></Form.Item>
        </FormModal>
      )}
    </>
  )
}
