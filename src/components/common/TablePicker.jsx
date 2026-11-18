import { Select } from 'antd'
import { Users } from 'lucide-react'
import { useState } from 'react'
import { SLOTS } from '@/utils/booking'
import { Chips } from '@/components/common/ui'

export { SLOTS }

/**
 * Lưới chọn bàn theo tầng → khu vực. Dùng cho đặt bàn (khách và nhân viên), chuyển bàn.
 * disabledReason(t) trả chuỗi lý do khi bàn không chọn được.
 * multiple + needSeats: đã đủ chỗ mà bấm bàn khác thì thay bàn, không cộng dồn.
 */
export default function TablePicker({ floors, areas, tables, value = [], onChange, multiple = false, needSeats = 0, disabledReason = () => null }) {
  const usable = tables.filter((t) => t.isActive)
  const activeFloors = floors.filter((f) => f.isActive).sort((a, b) => a.level - b.level)
  const floorOfValue = activeFloors.find((f) => areas.some((a) => a.floorId === f.id && usable.some((t) => t.areaId === a.id && value.includes(t.id))))
  const [chosen, setChosen] = useState(null)
  const floorId = chosen ?? floorOfValue?.id ?? activeFloors[0]?.id

  const toggle = (t) => {
    if (value.includes(t.id)) return onChange(value.filter((x) => x !== t.id))
    if (!multiple) return onChange([t.id])
    const seats = usable.filter((x) => value.includes(x.id)).reduce((s, x) => s + x.seats, 0)
    onChange(needSeats && seats >= needSeats ? [t.id] : [...value, t.id])
  }

  return (
    <div className="table-picker">
      <div className="row-between" style={{ flexWrap: 'wrap' }}>
        <Chips label="Tầng" value={floorId} onChange={setChosen} options={activeFloors.map((f) => ({ value: f.id, label: f.name }))} />
        <div className="tp-legend" aria-hidden="true"><span><i />Trống</span><span><i className="l-on" />Đang chọn</span><span><i className="l-off" />Không chọn được</span></div>
      </div>
      {areas.filter((a) => a.floorId === floorId && a.isActive).map((a) => {
        const list = usable.filter((t) => t.areaId === a.id)
        if (!list.length) return null
        return (
          <section key={a.id} className="tp-area">
            <h4>{a.name}</h4>
            <div className="tp-grid">
              {list.map((t) => {
                const reason = disabledReason(t)
                const on = value.includes(t.id)
                return (
                  <button type="button" key={t.id} className={`tp-cell${on ? ' on' : ''}`} disabled={!!reason} aria-pressed={on} onClick={() => toggle(t)} title={reason || undefined}>
                    <b>{t.code}</b>
                    <span>{reason || <><Users size={13} aria-hidden="true" /> {t.seats}</>}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}



/** Dropdown giờ đến, mỗi 30 phút. isPast(s) ẩn khung đã qua; disabledReason(s) làm mờ khung không chọn được. */
export function TimeSelect({ value, onChange, isPast = () => false, disabledReason = () => null, ...rest }) {
  const options = SLOTS.filter((s) => !isPast(s)).map((s) => {
    const reason = disabledReason(s)
    return { value: s, label: reason ? `${s} · ${reason}` : s, disabled: !!reason }
  })
  return <Select value={value} onChange={onChange} placeholder="Chọn giờ" options={options} notFoundContent="Hết giờ nhận khách" style={{ width: '100%' }} {...rest} />
}
