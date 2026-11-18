import { Button, Popconfirm, Space, Tag, Tooltip } from 'antd'
import { FilterX, Pencil, Trash2 } from 'lucide-react'

export function PageHeader({ title, extra, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {children}
      </div>
      {extra && <Space wrap>{extra}</Space>}
    </div>
  )
}

/** Thanh lọc phía trên bảng: ô tìm, các bộ lọc, nút xóa lọc. */
export function Toolbar({ children, onReset }) {
  return (
    <div className="toolbar">
      {children}
      {onReset && <Tooltip title="Xóa lọc"><Button className="toolbar-reset" type="text" aria-label="Xóa lọc" icon={<FilterX size={16} />} onClick={onReset} /></Tooltip>}
    </div>
  )
}

/** Nhóm nút lọc nhanh, cuộn ngang khi hẹp. options: [{ value, label, count? }]. */
export function Chips({ options, value, onChange, multiple = false, label }) {
  const isOn = (v) => (multiple ? value.includes(v) : value === v)
  const click = (v) => onChange(multiple ? (value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) : v)
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} className={`chip${isOn(o.value) ? ' on' : ''}`} aria-pressed={isOn(o.value)} onClick={() => click(o.value)}>
          {o.label}{o.count != null && <span>{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function StatusTag({ map, value }) {
  const [label, color] = map[value] ?? [value, 'default']
  return <Tag color={color}>{label}</Tag>
}

/** Nút Sửa và Xóa ở cuối mỗi dòng. Ẩn hẳn khi không có quyền (spec 2.2). */
export function RowActions({ onEdit, onDelete, deleteTitle = 'Xóa dòng này?', extra }) {
  return (
    <Space size={2} onClick={(e) => e.stopPropagation()}>
      {extra}
      {onEdit && (
        <Tooltip title="Sửa">
          <Button type="text" size="small" aria-label="Sửa" icon={<Pencil size={16} />} onClick={onEdit} />
        </Tooltip>
      )}
      {onDelete && (
        <Popconfirm title={deleteTitle} okText="Xóa" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={onDelete}>
          <Tooltip title="Xóa">
            <Button type="text" size="small" danger aria-label="Xóa" icon={<Trash2 size={16} />} />
          </Tooltip>
        </Popconfirm>
      )}
    </Space>
  )
}

export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

export function ItemThumb({ item, size = 48 }) {
  return item?.image
    ? <img className="thumb" src={item.image} alt="" width={size} height={size} />
    : <span className="thumb thumb-empty" style={{ width: size, height: size }} aria-hidden="true">{item?.name?.[0]}</span>
}
