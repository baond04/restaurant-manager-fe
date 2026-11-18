import dayjs from 'dayjs'
import 'dayjs/locale/vi'

dayjs.locale('vi')

export const money = (n) => `${Math.round(n || 0).toLocaleString('vi-VN')}đ`
export const fmtDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '')
export const fmtDateTime = (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '')
export const fmtTime = (d) => (d ? dayjs(d).format('HH:mm') : '')
export const minutesSince = (d) => Math.max(0, dayjs().diff(dayjs(d), 'minute'))
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
/** Tìm không dấu trên nhiều trường. */
export const matches = (q, ...fields) => !q || fields.some((f) => norm(f).includes(norm(q)))
/** Lọc theo khoảng ngày [from, to] của antd RangePicker. */
export const inRange = (d, range) => !range?.[0] || (dayjs(d).isAfter(range[0].startOf('day')) && dayjs(d).isBefore(range[1].endOf('day')))
export { dayjs }
