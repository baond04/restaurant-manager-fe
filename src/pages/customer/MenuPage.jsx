import { Empty, Input, Modal, Rate, Select, Tag } from 'antd'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { byId, useCol } from '@/hooks/useApi'
import { Chips, ItemThumb } from '@/components/common/ui'
import { fmtDate, matches, money } from '@/utils/format'

/** Ô món có ảnh vuông, dùng ở trang chủ. */
export function Dish({ item, onOpen }) {
  return (
    <article className="dish">
      <button type="button" className="dish-main" onClick={() => onOpen(item)}>
        <span className="dish-photo"><img src={item.image} alt="" loading="lazy" /></span>
        <span className="dish-name">{item.name}</span>
      </button>
      <span className="price">{money(item.price)}</span>
    </article>
  )
}

function MenuRow({ item, onOpen, action }) {
  return (
    <article className={`menu-row${item.isAvailable ? '' : ' off'}`}>
      <button type="button" className="menu-row-main" onClick={() => onOpen(item)}>
        {item.image ? <img src={item.image} alt="" loading="lazy" /> : <ItemThumb item={item} />}
        <span><span className="dish-name">{item.name}</span><small>{item.description}</small></span>
      </button>
      <div className="menu-row-side">
        <span className="price">{item.isAvailable ? money(item.price) : 'Tạm hết'}</span>
        {action}
      </div>
    </article>
  )
}

export function ItemModal({ item, onClose, footer = null }) {
  const { data: reviews } = useCol('reviews')
  const tags = byId(useCol('tags').data)
  const users = byId(useCol('users').data)
  if (!item) return null
  const rs = reviews.filter((r) => r.itemId === item.id && !r.hidden)
  const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0
  return (
    <Modal open title={item.name} onCancel={onClose} footer={footer} width={520}>
      {item.image && <img src={item.image} alt="" className="modal-img" />}
      <p className="price" style={{ fontSize: 16 }}>{money(item.price)}</p>
      <p style={{ margin: '4px 0 8px' }}>{item.description}</p>
      <div className="row-gap" style={{ flexWrap: 'wrap', marginBottom: 16 }}>{item.tagIds.map((t) => <Tag key={t}>{tags[t]?.name}</Tag>)}</div>
      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Đánh giá {rs.length > 0 && <span className="muted" style={{ fontWeight: 400 }}>{avg.toFixed(1)}/5 · {rs.length} lượt</span>}</h3>
      {!rs.length && <p className="muted">Chưa có đánh giá</p>}
      {rs.slice(0, 5).map((r) => (
        <div key={r.id} className="review">
          <div className="row-between"><b>{users[r.customerId]?.fullName}</b><Rate disabled value={r.rating} style={{ fontSize: 12 }} /></div>
          <p>{r.comment}</p>
          <span className="muted" style={{ fontSize: 12 }}>{fmtDate(r.createdAt)}</span>
        </div>
      ))}
    </Modal>
  )
}

/** Thực đơn có lọc, xếp theo danh mục. Dùng ở trang khách và trang gọi món tại bàn (renderAction thêm nút "+"). */
export function MenuBrowser({ renderAction, compact }) {
  const { data: items } = useCol('items')
  const { data: cats } = useCol('categories')
  const { data: tags } = useCol('tags')
  const { data: lines } = useCol('orderItems')
  const [cat, setCat] = useState(0)
  const [tag, setTag] = useState([])
  const [params] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '') // trợ lý dẫn sang với ?q=tên món
  const [sort, setSort] = useState('cat')
  const [open, setOpen] = useState(null)
  const activeCats = cats.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  let shown = items.filter((i) => activeCats.some((c) => c.id === i.categoryId) && (!cat || i.categoryId === cat) && tag.every((t) => i.tagIds.includes(t)) && matches(q, i.name))
  if (sort === 'asc') shown = [...shown].sort((a, b) => a.price - b.price)
  if (sort === 'desc') shown = [...shown].sort((a, b) => b.price - a.price)
  if (sort === 'popular') {
    const sold = new Map()
    lines.forEach((l) => sold.set(l.itemId, (sold.get(l.itemId) || 0) + l.qty))
    shown = [...shown].sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0))
  }
  const row = (it) => <MenuRow key={it.id} item={it} onOpen={setOpen} action={renderAction?.(it)} />

  return (
    <>
      <div className="menu-filters">
        <div className="toolbar">
          <Input allowClear prefix={<Search size={16} />} placeholder="Tìm món" aria-label="Tìm món" value={q} onChange={(e) => setQ(e.target.value)} />
          {!compact && <Select mode="multiple" allowClear placeholder="Vị, thành phần" aria-label="Lọc theo tag" value={tag} onChange={setTag} style={{ minWidth: 200 }} maxTagCount="responsive" options={tags.filter((t) => ['TASTE', 'DIET', 'INGREDIENT'].includes(t.type)).map((t) => ({ value: t.id, label: t.name }))} />}
          {!compact && <Select value={sort} onChange={setSort} aria-label="Sắp xếp" options={[{ value: 'cat', label: 'Theo danh mục' }, { value: 'popular', label: 'Gọi nhiều nhất' }, { value: 'asc', label: 'Giá tăng dần' }, { value: 'desc', label: 'Giá giảm dần' }]} />}
        </div>
        <Chips label="Danh mục" value={cat} onChange={setCat} options={[{ value: 0, label: 'Tất cả' }, ...activeCats.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      {!shown.length && <Empty description="Không có món phù hợp" />}
      {sort === 'cat'
        ? activeCats.filter((c) => shown.some((i) => i.categoryId === c.id)).map((c) => (
          <section key={c.id} className="menu-cat">
            <h2>{c.name}</h2>
            <div className="menu-rows">{shown.filter((i) => i.categoryId === c.id).map(row)}</div>
          </section>
        ))
        : <div className="menu-rows">{shown.map(row)}</div>}
      <ItemModal item={open} onClose={() => setOpen(null)} footer={open && renderAction?.(open)} />
    </>
  )
}

export default function CustomerMenuPage() {
  return (
    <div className="wrap page">
      <h1 className="page-title" style={{ marginBottom: 8 }}>Thực đơn</h1>
      <MenuBrowser />
    </div>
  )
}
