import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/calendar'
import { Select } from '@/components/ui/select'
import { atSlot, firstDay, LEAD_MINUTES, SLOTS } from '@/utils/booking'
import { dayjs } from '@/utils/format'

const GUESTS = Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: `${i + 1} khách` }))
const label = 'mb-1.5 block text-s6 font-semibold text-ink-soft'

export default function BookingBar() {
  const nav = useNavigate()
  const [date, setDate] = useState(() => firstDay())
  const [slot, setSlot] = useState()
  const [guests, setGuests] = useState(2)
  const options = SLOTS.filter((s) => !atSlot(date, s).isBefore(dayjs().add(LEAD_MINUTES, 'minute'))).map((s) => ({ value: s, label: s }))
  const validSlot = options.some((o) => o.value === slot) ? slot : undefined

  const submit = (e) => {
    e.preventDefault()
    nav(`/booking?${new URLSearchParams({ date: date.format('YYYY-MM-DD'), guests, ...(validSlot && { slot: validSlot }) })}`)
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 items-end gap-3 rounded-site bg-white p-4 shadow-float xl:grid-cols-[1fr_1fr_1fr_auto]">
      <div><span className={label}>Ngày</span><DatePicker aria-label="Ngày đến" value={date.toDate()} onChange={(d) => setDate(dayjs(d))} disabled={{ before: firstDay().toDate(), after: dayjs().add(60, 'day').toDate() }} /></div>
      <div><span className={label}>Giờ đến</span><Select aria-label="Giờ đến" placeholder="Chọn giờ" value={validSlot} onValueChange={setSlot} options={options} /></div>
      <div><span className={label}>Số khách</span><Select aria-label="Số khách" value={guests} onValueChange={setGuests} options={GUESTS} /></div>
      <Button type="submit" className="h-10 px-6">Tìm bàn</Button>
    </form>
  )
}
