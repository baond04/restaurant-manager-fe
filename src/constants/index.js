// Nhãn và màu trạng thái. Màu luôn đi kèm chữ (spec 7.7).
export const TABLE_STATUS = {
  AVAILABLE: ['Trống', 'green'], OCCUPIED: ['Có khách', 'orange'], RESERVED: ['Đã đặt', 'blue'], CLEANING: ['Đang dọn', 'gold'], DISABLED: ['Ngừng dùng', 'default'],
}
export const ITEM_STATUS = {
  PENDING: ['Chờ bếp', 'gold'], COOKING: ['Đang nấu', 'blue'], READY: ['Xong, chờ mang ra', 'green'], SERVED: ['Đã phục vụ', 'default'], CANCELLED: ['Đã hủy', 'red'],
}
export const RES_STATUS = {
  PENDING: ['Chờ xác nhận', 'gold'], CONFIRMED: ['Đã xác nhận', 'blue'], SEATED: ['Đã nhận bàn', 'green'], COMPLETED: ['Hoàn thành', 'default'], CANCELLED: ['Đã hủy', 'red'], NO_SHOW: ['Không đến', 'volcano'],
}
export const BILL_STATUS = { PAID: ['Đã thanh toán', 'green'], VOID: ['Đã hủy', 'red'], OPEN: ['Chưa thanh toán', 'gold'] }
export const PAY_METHOD = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', CARD: 'Thẻ' }
export const AREA_TYPE = { HALL: 'Sảnh', OUTDOOR: 'Sân thượng', VIP_ROOM: 'Phòng VIP', BAR: 'Quầy bar' }
export const REQUEST_TYPE = { CALL_STAFF: 'Gọi nhân viên', REQUEST_BILL: 'Tính tiền', EXTRA_WATER: 'Thêm nước, đá', EXTRA_UTENSIL: 'Thêm bát đũa', OTHER: 'Khác' }
export const REQUEST_STATUS = { OPEN: ['Mới', 'red'], ACKNOWLEDGED: ['Đã nhận', 'blue'], DONE: ['Xong', 'default'] }
export const WORK_STATUS = { WORKING: ['Đang làm', 'green'], ON_LEAVE: ['Tạm nghỉ', 'gold'], QUIT: ['Đã nghỉ việc', 'default'] }
export const ACCOUNT_STATUS = { ACTIVE: ['Hoạt động', 'green'], LOCKED: ['Đã khóa', 'red'] }
export const SCHEDULE_STATUS = { SCHEDULED: ['Đã xếp', 'blue'], PRESENT: ['Có mặt', 'green'], ABSENT: ['Vắng', 'red'] }
export const TX_TYPE = { IMPORT: ['Nhập', 'green'], EXPORT: ['Xuất', 'orange'], ADJUST: ['Điều chỉnh', 'blue'], CONSUME: ['Trừ theo món', 'default'] }
export const TAG_TYPE = { TASTE: 'Vị', INGREDIENT: 'Thành phần', DIET: 'Chế độ ăn', OCCASION: 'Dịp', CUISINE: 'Vùng miền' }
export const SOURCE = { MENU: 'Thực đơn', CHATBOT: 'Gợi ý AI', STAFF: 'Nhân viên gọi' }
export const SEAT_FILTERS = [[2, '2 chỗ'], [4, '4 chỗ'], [6, '6 chỗ'], [8, '8+ chỗ']]
export const seatBucket = (s) => (s <= 2 ? 2 : s <= 4 ? 4 : s <= 6 ? 6 : 8)
export const toOptions = (map) => Object.entries(map).map(([value, v]) => ({ value, label: Array.isArray(v) ? v[0] : v }))
