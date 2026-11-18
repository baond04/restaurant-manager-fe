import { Button, DatePicker, Form, Input, Popconfirm, Select, Space, Table, Tabs, TimePicker } from 'antd'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import FormModal, { useCrud } from '@/components/common/FormModal'
import { PageHeader, RowActions, StatusTag, Toolbar } from '@/components/common/ui'
import { SCHEDULE_STATUS, toOptions, WORK_STATUS } from '@/constants'
import { dayjs, fmtDate, matches } from '@/utils/format'

export default function StaffPage() {
  const { can } = useStaff()
  return (
    <>
      <PageHeader title="Nhân viên và ca" />
      <Tabs destroyOnHidden items={[
        can('staff:view') && { key: 'emp', label: 'Nhân viên', children: <EmployeesTab /> },
        { key: 'week', label: 'Lịch ca', children: <ScheduleTab /> },
        can('schedule:manage') && { key: 'shifts', label: 'Ca làm', children: <ShiftsTab /> },
      ].filter(Boolean)} />
    </>
  )
}

function EmployeesTab() {
  const { can } = useStaff()
  const write = can('staff:manage')
  const { data: users, isLoading } = useCol('users')
  const { data: roles } = useCol('roles')
  const roleMap = byId(roles)
  const crud = useCrud('users', 'nhân viên')
  const [f, setF] = useState({ q: '', role: [], work: undefined, position: undefined })
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const [editing, setEditing] = useState(null)
  const staff = users.filter((u) => u.kind === 'STAFF')
  const positions = [...new Set(staff.map((u) => u.position).filter(Boolean))]
  const rows = staff.filter((u) => matches(f.q, u.fullName, u.email, u.phone) && (!f.role.length || f.role.includes(u.roleId)) && (!f.work || u.workStatus === f.work) && (!f.position || u.position === f.position))

  return (
    <>
      <Toolbar onReset={() => setF({ q: '', role: [], work: undefined, position: undefined })}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tên, email, điện thoại" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <Select mode="multiple" allowClear placeholder="Vai trò" value={f.role} onChange={(v) => set({ role: v })} style={{ minWidth: 180 }} options={roles.filter((r) => r.code !== 'CUSTOMER').map((r) => ({ value: r.id, label: r.name }))} />
        <Select allowClear placeholder="Chức vụ" value={f.position} onChange={(v) => set({ position: v })} options={positions.map((p) => ({ value: p, label: p }))} />
        <Select allowClear placeholder="Tình trạng" value={f.work} onChange={(v) => set({ work: v })} options={toOptions(WORK_STATUS)} />
        <div style={{ flex: 1 }} />
        {write && <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({ workStatus: 'WORKING', hireDate: dayjs() })}>Thêm nhân viên</Button>}
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 900 }} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} nhân viên` }} columns={[
        { title: 'Họ tên', dataIndex: 'fullName', sorter: (a, b) => a.fullName.localeCompare(b.fullName), render: (v) => <b>{v}</b> },
        { title: 'Vai trò', render: (_, u) => roleMap[u.roleId]?.name },
        { title: 'Chức vụ', dataIndex: 'position' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'Điện thoại', dataIndex: 'phone' },
        { title: 'Ngày vào làm', dataIndex: 'hireDate', render: fmtDate, sorter: (a, b) => a.hireDate.localeCompare(b.hireDate) },
        { title: 'Tình trạng', dataIndex: 'workStatus', render: (v) => <StatusTag map={WORK_STATUS} value={v} /> },
        write && { title: '', width: 90, render: (_, u) => <RowActions onEdit={() => setEditing({ ...u, hireDate: dayjs(u.hireDate) })} onDelete={() => crud.remove(u.id)} /> },
      ].filter(Boolean)} />
      {editing && (
        <FormModal title="nhân viên" value={editing} width={640} onClose={() => setEditing(null)}
          onSubmit={(v, isNew) => crud.save(editing, { ...v, hireDate: v.hireDate.format('YYYY-MM-DD'), ...(isNew && { kind: 'STAFF', status: 'ACTIVE' }) })}>
          <div className="grid-2">
            <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input /></Form.Item>
            <Form.Item name="roleId" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}><Select options={roles.filter((r) => r.code !== 'CUSTOMER').map((r) => ({ value: r.id, label: r.name }))} /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input /></Form.Item>
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: '10 số, bắt đầu bằng 0' }]}><Input /></Form.Item>
            <Form.Item name="position" label="Chức vụ" rules={[{ required: true, message: 'Nhập chức vụ' }]}><Input /></Form.Item>
            <Form.Item name="hireDate" label="Ngày vào làm" rules={[{ required: true }]}><DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="workStatus" label="Tình trạng"><Select options={toOptions(WORK_STATUS)} /></Form.Item>
          </div>
        </FormModal>
      )}
    </>
  )
}

function ScheduleTab() {
  const { can } = useStaff()
  const write = can('schedule:manage')
  const { data: schedules } = useCol('schedules')
  const { data: users } = useCol('users')
  const { data: roles } = useCol('roles')
  const { data: areas } = useCol('areas')
  const shifts = byId(useCol('shifts').data)
  const areaMap = byId(areas)
  const crud = useCrud('schedules', 'lịch')
  const [week, setWeek] = useState(dayjs().startOf('week'))
  const [role, setRole] = useState()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const days = Array.from({ length: 7 }, (_, i) => week.add(i, 'day'))
  const staff = users.filter((u) => u.kind === 'STAFF' && u.workStatus !== 'QUIT' && u.roleId !== 6 && (!role || u.roleId === role) && matches(q, u.fullName))

  return (
    <>
      <Toolbar>
        <Space.Compact>
          <Button aria-label="Tuần trước" icon={<ChevronLeft size={16} />} onClick={() => setWeek(week.subtract(1, 'week'))} />
          <DatePicker picker="week" value={week} onChange={(d) => d && setWeek(d.startOf('week'))} format={(d) => `${d.startOf('week').format('DD/MM')} – ${d.endOf('week').format('DD/MM/YYYY')}`} allowClear={false} />
          <Button aria-label="Tuần sau" icon={<ChevronRight size={16} />} onClick={() => setWeek(week.add(1, 'week'))} />
        </Space.Compact>
        <Input allowClear prefix={<Search size={16} />} placeholder="Tìm nhân viên" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select allowClear placeholder="Vai trò" value={role} onChange={setRole} options={roles.filter((r) => !['CUSTOMER', 'ADMIN'].includes(r.code)).map((r) => ({ value: r.id, label: r.name }))} />
      </Toolbar>
      <div style={{ overflowX: 'auto' }}>
        <table className="week">
          <thead><tr><th style={{ minWidth: 160 }}>Nhân viên</th>{days.map((d) => <th key={d} className={d.isSame(dayjs(), 'day') ? 'today' : ''}>{d.format('dd DD/MM')}</th>)}</tr></thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id}>
                <th scope="row">{u.fullName}<div className="muted" style={{ fontWeight: 400, fontSize: 12 }}>{roles.find((r) => r.id === u.roleId)?.name}</div></th>
                {days.map((d) => {
                  const ds = d.format('YYYY-MM-DD')
                  const list = schedules.filter((s) => s.employeeId === u.id && s.date === ds)
                  return (
                    <td key={ds} className={d.isSame(dayjs(), 'day') ? 'today' : ''}>
                      {list.map((s) => (
                        <button type="button" key={s.id} className={`shift-chip${s.status === 'ABSENT' ? ' absent' : ''}`} disabled={!write} onClick={() => setEditing(s)}>
                          {shifts[s.shiftId]?.name.replace('Ca ', '')}{s.areaId && ` · ${areaMap[s.areaId]?.name}`}{s.status === 'ABSENT' && ' · vắng'}
                        </button>
                      ))}
                      {write && <Button className="add-shift" type="text" size="small" aria-label={`Thêm ca ${u.fullName} ${d.format('DD/MM')}`} icon={<Plus size={14} />} onClick={() => setEditing({ employeeId: u.id, date: ds, shiftId: 1, status: 'SCHEDULED' })} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <FormModal title="ca làm" value={editing} onClose={() => setEditing(null)} onSubmit={(v) => {
          const dup = schedules.some((s) => s.id !== editing.id && s.employeeId === editing.employeeId && s.date === editing.date && s.shiftId === v.shiftId)
          return dup ? crud.run(() => Promise.reject(new Error('Nhân viên đã có ca này trong ngày'))) : crud.save(editing, { ...editing, ...v, areaId: v.areaId ?? null })
        }}>
          <p className="muted">{users.find((u) => u.id === editing.employeeId)?.fullName} · {fmtDate(editing.date)}</p>
          <Form.Item name="shiftId" label="Ca" rules={[{ required: true }]}><Select options={Object.values(shifts).map((s) => ({ value: s.id, label: `${s.name} ${s.start}–${s.end}` }))} /></Form.Item>
          <Form.Item name="areaId" label="Khu vực phụ trách"><Select allowClear options={areas.map((a) => ({ value: a.id, label: a.name }))} /></Form.Item>
          <Form.Item name="status" label="Chấm công"><Select options={toOptions(SCHEDULE_STATUS)} /></Form.Item>
          {editing.id && (
            <Popconfirm title="Xóa ca này?" okText="Xóa" cancelText="Không" okButtonProps={{ danger: true }} onConfirm={() => crud.remove(editing.id).then(() => setEditing(null))}>
              <Button danger>Xóa ca</Button>
            </Popconfirm>
          )}
        </FormModal>
      )}
    </>
  )
}

function ShiftsTab() {
  const { data: shifts } = useCol('shifts')
  const crud = useCrud('shifts', 'ca')
  const [editing, setEditing] = useState(null)
  const fmt = 'HH:mm'
  return (
    <>
      <Toolbar><div style={{ flex: 1 }} /><Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing({})}>Thêm ca</Button></Toolbar>
      <Table rowKey="id" dataSource={shifts} pagination={false} columns={[
        { title: 'Tên ca', dataIndex: 'name' },
        { title: 'Bắt đầu', dataIndex: 'start' },
        { title: 'Kết thúc', dataIndex: 'end' },
        { title: '', width: 90, render: (_, s) => <RowActions onEdit={() => setEditing({ ...s, time: [dayjs(s.start, fmt), dayjs(s.end, fmt)] })} onDelete={() => crud.remove(s.id)} /> },
      ]} />
      {editing && (
        <FormModal title="ca" value={editing} onClose={() => setEditing(null)} onSubmit={(v) => crud.save(editing, { name: v.name, start: v.time[0].format(fmt), end: v.time[1].format(fmt) })}>
          <Form.Item name="name" label="Tên ca" rules={[{ required: true, message: 'Nhập tên ca' }]}><Input /></Form.Item>
          <Form.Item name="time" label="Giờ" rules={[{ required: true, message: 'Chọn giờ' }]}><TimePicker.RangePicker format={fmt} minuteStep={15} /></Form.Item>
        </FormModal>
      )}
    </>
  )
}
