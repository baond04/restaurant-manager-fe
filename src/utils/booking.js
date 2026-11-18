import dayjs from 'dayjs'

export const DINING_HOURS = 2 // mỗi lượt đặt giữ bàn 2 giờ
export const LEAD_MINUTES = 30 // đặt trước ít nhất 30 phút
const ACTIVE = ['PENDING', 'CONFIRMED', 'SEATED']

/** Khung giờ đến, mỗi 30 phút từ 10:00 đến 21:00. */
export const SLOTS = Array.from({ length: 23 }, (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)

/** Ngày sớm nhất còn đặt được. */
export const firstDay = () => (dayjs().add(LEAD_MINUTES, 'minute').isAfter(dayjs().hour(21)) ? dayjs().add(1, 'day') : dayjs())

/** Lượt đặt khác đang giữ bàn này trong khoảng ±2 giờ quanh thời điểm `at`. */
export function tableConflict(reservations, tableId, at, excludeId) {
  const t = dayjs(at)
  return reservations.find((r) => r.id !== excludeId && ACTIVE.includes(r.status) && r.tableIds.includes(tableId) && Math.abs(dayjs(r.time).diff(t, 'minute')) < DINING_HOURS * 60)
}

/** Ghép ngày (dayjs) với "HH:mm". */
export const atSlot = (date, slot) => dayjs(date).hour(+slot.slice(0, 2)).minute(+slot.slice(3)).second(0).millisecond(0)
