import { Button, Form, Input, Select, Table, Tooltip } from 'antd'
import { KeyRound, Lock, LockOpen, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { ACCOUNT_STATUS, toOptions } from '@/constants'
import { fmtDateTime, matches } from '@/utils/format'

export default function UsersPage() {
  const { user: me } = useStaff()
  const { data: users, isLoading } = useCol('users')
  const { data: roles } = useCol('roles')
  const roleMap = byId(roles)
  const crud = useCrud('users', 'tài khoản')
  const [q, setQ] = useState('')
  const [role, setRole] = useState([])
  const [status, setStatus] = useState()
  const [editing, setEditing] = useState(null)
  const rows = users.filter((u) => matches(q, u.fullName, u.email, u.phone) && (!role.length || role.includes(u.roleId)) && (!status || u.status === status))

  return (
    <>
      <PageHeader title="Người dùng" extra={<Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ status: 'ACTIVE', roleId: 2 })}>Thêm tài khoản</Button>} />
      <Toolbar onReset={() => { setQ(''); setRole([]); setStatus() }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tên, email, điện thoại" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select mode="multiple" allowClear placeholder="Vai trò" value={role} onChange={setRole} options={roles.map((r) => ({ value: r.id, label: r.name }))} style={{ minWidth: 200 }} />
        <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={toOptions(ACCOUNT_STATUS)} />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 900 }} pagination={{ hideOnSinglePage: true, pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n} tài khoản` }} columns={[
        { title: 'Họ tên', dataIndex: 'fullName', render: (v) => <b>{v}</b>, sorter: (a, b) => a.fullName.localeCompare(b.fullName) },
        { title: 'Email', dataIndex: 'email' },
        { title: 'Điện thoại', dataIndex: 'phone' },
        { title: 'Vai trò', render: (_, u) => roleMap[u.roleId]?.name, sorter: (a, b) => a.roleId - b.roleId },
        { title: 'Đăng nhập gần nhất', dataIndex: 'lastLoginAt', render: fmtDateTime, sorter: (a, b) => a.lastLoginAt.localeCompare(b.lastLoginAt) },
        { title: 'Trạng thái', dataIndex: 'status', render: (v) => <StatusTag map={ACCOUNT_STATUS} value={v} /> },
        {
          title: '', width: 150, render: (_, u) => u.id !== me.id && (
            <RowActions onEdit={() => setEditing(u)} onDelete={() => crud.remove(u.id)} extra={<>
              <Tooltip title="Gửi email đặt lại mật khẩu"><Button type="text" size="small" aria-label="Đặt lại mật khẩu" icon={<KeyRound size={16} />} onClick={() => crud.run(() => Promise.resolve(), `Đã gửi email tới ${u.email}`)} /></Tooltip>
              <Tooltip title={u.status === 'ACTIVE' ? 'Khóa (đăng xuất mọi thiết bị)' : 'Mở khóa'}>
                <Button type="text" size="small" aria-label={u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} icon={u.status === 'ACTIVE' ? <Lock size={16} /> : <LockOpen size={16} />}
                  onClick={() => crud.save(u, { status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' })} />
              </Tooltip>
            </>} />
          ),
        },
      ]} />
      {editing && (
        <FormModal title="tài khoản" value={editing} onClose={() => setEditing(null)}
          onSubmit={({ password: _sentToBackendOnly, ...v }, isNew) => crud.save(editing, { ...v, kind: roleMap[v.roleId]?.code === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF', ...(isNew && { points: 0, workStatus: 'WORKING', lastLoginAt: new Date().toISOString() }) })}>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input /></Form.Item>
          <div className="grid-2">
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input /></Form.Item>
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: '10 số, bắt đầu bằng 0' }]}><Input /></Form.Item>
            <Form.Item name="roleId" label="Vai trò" rules={[{ required: true }]}><Select options={roles.map((r) => ({ value: r.id, label: r.name }))} /></Form.Item>
            <Form.Item name="status" label="Trạng thái"><Select options={toOptions(ACCOUNT_STATUS)} /></Form.Item>
          </div>
          {!editing.id && <Form.Item name="password" label="Mật khẩu tạm" rules={[{ required: true, min: 8, message: 'Ít nhất 8 ký tự' }]}><Input.Password autoComplete="new-password" /></Form.Item>}
        </FormModal>
      )}
    </>
  )
}
