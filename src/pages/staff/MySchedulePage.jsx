import { Segmented, Table } from 'antd'
import { useState } from 'react'
import { byId, useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { PageHeader, StatusTag } from '@/components/common/ui'
import { SCHEDULE_STATUS } from '@/constants'
import { dayjs } from '@/utils/format'

export default function MySchedulePage() {
  const { user } = useStaff()
  const { data: schedules } = useCol('schedules')
  const shifts = byId(useCol('shifts').data)
  const areas = byId(useCol('areas').data)
  const [offset, setOffset] = useState(0)
  const start = dayjs().startOf('week').add(offset, 'week')
  const rows = schedules.filter((s) => s.employeeId === user.id && !dayjs(s.date).isBefore(start) && dayjs(s.date).isBefore(start.add(1, 'week'))).sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHeader title="Lịch làm của tôi" />
      <div className="toolbar">
        <Segmented value={offset} onChange={setOffset} options={[{ value: -1, label: 'Tuần trước' }, { value: 0, label: 'Tuần này' }, { value: 1, label: 'Tuần sau' }]} />
        <span className="muted">{start.format('DD/MM')} – {start.add(6, 'day').format('DD/MM/YYYY')}</span>
      </div>
      <Table rowKey="id" dataSource={rows} pagination={false} locale={{ emptyText: 'Chưa có ca' }} rowClassName={(s) => (s.date === dayjs().format('YYYY-MM-DD') ? 'row-today' : '')} columns={[
        { title: 'Ngày', dataIndex: 'date', render: (d) => dayjs(d).format('dddd, DD/MM') },
        { title: 'Ca', render: (_, s) => `${shifts[s.shiftId]?.name} (${shifts[s.shiftId]?.start}–${shifts[s.shiftId]?.end})` },
        { title: 'Khu vực', render: (_, s) => areas[s.areaId]?.name ?? 'Không gán' },
        { title: 'Chấm công', dataIndex: 'status', render: (v) => <StatusTag map={SCHEDULE_STATUS} value={v} /> },
      ]} />
    </>
  )
}
