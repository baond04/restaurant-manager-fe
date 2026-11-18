import { Alert, Button, Checkbox, Form, Input, Popconfirm, Select, Switch, Tag } from 'antd'
import { Copy, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/services/api'
import { useCol } from '@/hooks/useApi'
import { canSee, PERMISSION_GROUPS, STAFF_NAV } from '@/constants/permissions'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader } from '@/components/common/ui'
import { matches } from '@/utils/format'

export default function RolesPage() {
  const { data: roles } = useCol('roles')
  const { data: users } = useCol('users')
  const crud = useCrud('roles', 'vai trò')
  const [roleId, setRoleId] = useState(2)
  const [cloning, setCloning] = useState(null)
  const role = roles.find((r) => r.id === roleId)

  return (
    <>
      <PageHeader title="Vai trò và quyền" extra={<Button icon={<Copy size={16} />} onClick={() => setCloning({ fromId: roleId })}>Thêm vai trò</Button>} />
      <div className="split">
        <nav className="card role-list" aria-label="Vai trò">
          {roles.map((r) => (
            <button type="button" key={r.id} aria-current={r.id === roleId} onClick={() => setRoleId(r.id)}>
              <span>{r.name}{!r.isSystem && <Tag style={{ marginLeft: 6 }}>Tùy chỉnh</Tag>}</span>
              <span className="muted">{users.filter((u) => u.roleId === r.id).length}</span>
            </button>
          ))}
        </nav>
        {role && <RoleEditor key={role.id + role.permissions.join()} role={role} onDeleted={() => setRoleId(2)} crud={crud} />}
      </div>
      {cloning && (
        <FormModal title="vai trò" value={cloning} onClose={() => setCloning(null)}
          onSubmit={(v) => crud.run(() => api.cloneRole(v.fromId, { code: v.code.toUpperCase(), name: v.name }), 'Đã thêm vai trò').then((r) => setRoleId(r.id))}>
          <Form.Item name="fromId" label="Nhân bản từ"><Select options={roles.filter((r) => !r.fixed).map((r) => ({ value: r.id, label: r.name }))} /></Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}><Input placeholder="Trưởng ca" /></Form.Item>
          <Form.Item name="code" label="Mã" rules={[{ required: true, pattern: /^[A-Za-z_]{3,30}$/, message: 'Chữ không dấu và dấu gạch dưới' }]}><Input placeholder="SHIFT_LEAD" style={{ textTransform: 'uppercase' }} /></Form.Item>
        </FormModal>
      )}
    </>
  )
}

function RoleEditor({ role, crud, onDeleted }) {
  const [perms, setPerms] = useState(new Set(role.permissions))
  const [meta, setMeta] = useState({ name: role.name, description: role.description })
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState(new Set())
  const locked = role.locked || role.fixed
  const original = new Set(role.permissions)
  const changed = [...new Set([...perms, ...original])].filter((p) => perms.has(p) !== original.has(p))
  const metaChanged = meta.name !== role.name || meta.description !== role.description
  const dirty = changed.length > 0 || metaChanged

  const set = (codes, on) => setPerms((s) => { const n = new Set(s); codes.forEach((c) => (on ? n.add(c) : n.delete(c))); return n })
  const before = STAFF_NAV.filter((n) => canSee(n, role.permissions))
  const after = STAFF_NAV.filter((n) => canSee(n, [...perms]))

  if (role.fixed) return <Alert type="info" showIcon title="Quyền của khách hàng cố định trong hệ thống: đặt bàn, gọi món tại bàn, đánh giá, trò chuyện với trợ lý." />

  return (
    <section>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid-2">
          <Input aria-label="Tên vai trò" value={meta.name} disabled={locked} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
          <Input aria-label="Mô tả" value={meta.description} disabled={locked} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
        </div>
        {role.locked && <p className="muted" style={{ margin: '8px 0 0' }}>Quản trị luôn có mọi quyền.</p>}
      </div>

      <div className="roles-body">
        <div>
          <div className="toolbar"><Input allowClear prefix={<Search size={16} />} placeholder="Tìm quyền" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {PERMISSION_GROUPS.map((g) => {
            const list = g.perms.filter(([c, l]) => matches(q, c, l, g.name))
            if (!list.length) return null
            const codes = g.perms.map(([c]) => c)
            const n = codes.filter((c) => perms.has(c)).length
            const open = !closed.has(g.code) || q
            return (
              <div key={g.code} className="perm-group">
                <header>
                  <Checkbox checked={n === codes.length} indeterminate={n > 0 && n < codes.length} disabled={locked} onChange={(e) => set(codes, e.target.checked)} aria-label={`Chọn cả nhóm ${g.name}`} />
                  <button type="button" className="linklike" onClick={() => setClosed((s) => { const x = new Set(s); if (!x.delete(g.code)) x.add(g.code); return x })} aria-expanded={!!open}>
                    <b>{g.name}</b>
                  </button>
                  <span className="count">{n}/{codes.length}</span>
                </header>
                {open && list.map(([c, label]) => (
                  <label key={c} className={`perm-row${changed.includes(c) ? ' changed' : ''}`}>
                    <span>{label}<br /><code>{c}</code></span>
                    <Switch size="small" checked={perms.has(c)} disabled={locked} onChange={(on) => set([c], on)} />
                  </label>
                ))}
              </div>
            )
          })}
        </div>
        <aside className="card sticky">
          <b>Menu vai trò này sẽ thấy</b>
          <ul className="menu-preview">
            {after.map((n) => <li key={n.path}>{n.label}{!before.includes(n) && <Tag color="green" style={{ marginLeft: 6 }}>mới</Tag>}</li>)}
            {before.filter((n) => !after.includes(n)).map((n) => <li key={n.path} className="removed">{n.label} <Tag color="red">bỏ</Tag></li>)}
          </ul>
          {!role.isSystem && (
            <Popconfirm title={`Xóa vai trò ${role.name}?`} okText="Xóa" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => crud.remove(role.id).then(onDeleted)}>
              <Button danger block icon={<Trash2 size={16} />}>Xóa vai trò</Button>
            </Popconfirm>
          )}
        </aside>
      </div>

      {dirty && !locked && (
        <div className="save-bar" role="status">
          <span>{changed.length ? `Đã sửa ${changed.length} quyền` : 'Đã sửa thông tin'}</span>
          <span className="muted">Có hiệu lực ở lần thao tác kế tiếp của người dùng.</span>
          <div style={{ flex: 1 }} />
          <Button onClick={() => { setPerms(new Set(role.permissions)); setMeta({ name: role.name, description: role.description }) }}>Hủy</Button>
          <Button type="primary" onClick={() => crud.save(role, { ...meta, permissions: [...perms] })}>Lưu</Button>
        </div>
      )}
    </section>
  )
}
