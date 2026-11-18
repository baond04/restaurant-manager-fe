import { Button, Select, Switch } from 'antd'
import { Row, Rows } from '@/components/common/Rows'
import { useState } from 'react'
import { api } from '@/services/api'
import { byId, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { PageHeader, StatusTag, Toolbar } from '@/components/common/ui'
import { REQUEST_STATUS, REQUEST_TYPE } from '@/constants'
import { dayjs, minutesSince } from '@/utils/format'

export default function ServicePage() {
  const { user, can } = useStaff()
  const run = useRun()
  const { data: reqs } = useCol('serviceRequests')
  const { data: schedules } = useCol('schedules')
  const { data: floors } = useCol('floors')
  const tables = byId(useCol('tables').data)
  const areas = byId(useCol('areas').data)
  const users = byId(useCol('users').data)
  const [mine, setMine] = useState(false)
  const [floorId, setFloorId] = useState()

  const myArea = schedules.find((s) => s.employeeId === user.id && s.date === dayjs().format('YYYY-MM-DD'))?.areaId
  const tableOk = (tid) => {
    const t = tables[tid]
    if (!t) return !mine && !floorId // mang đi
    if (mine && t.areaId !== myArea) return false
    return !floorId || areas[t.areaId]?.floorId === floorId
  }
  const open = reqs.filter((r) => r.status !== 'DONE' && tableOk(r.tableId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const tableLabel = (tid) => (tables[tid] ? `Bàn ${tables[tid].code}` : 'Mang đi')

  return (
    <>
      <PageHeader title="Yêu cầu của khách" />
      <Toolbar>
        <Select allowClear placeholder="Tầng" value={floorId} onChange={setFloorId} options={floors.map((f) => ({ value: f.id, label: f.name }))} />
        {myArea && <label className="switch-label"><Switch checked={mine} onChange={setMine} /> Chỉ {areas[myArea]?.name}</label>}
      </Toolbar>
      <div>
        {can('request:handle') && (
          <section className="card">
            <h2 className="card-title">Yêu cầu của khách ({open.length})</h2>
            <Rows data={open} empty="Không có yêu cầu">{(r) => (
              <Row title={<>{tableLabel(r.tableId)} · {REQUEST_TYPE[r.type]} <StatusTag map={REQUEST_STATUS} value={r.status} /></>}
                desc={`${minutesSince(r.createdAt)} phút trước${r.handledBy ? ` · ${users[r.handledBy]?.fullName} đã nhận` : ''}`}
                extra={r.status === 'OPEN'
                  ? <Button onClick={() => run(() => api.ackRequest(r.id, user.id))}>Nhận</Button>
                  : <Button type="primary" onClick={() => run(() => api.doneRequest(r.id, user.id), 'Đã xong')}>Xong</Button>} />
            )}</Rows>
          </section>
        )}
      </div>
    </>
  )
}
