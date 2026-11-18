// Lớp gọi nghiệp vụ: mỗi hàm là một API REST của Spring Boot (Swagger: http://localhost:8080/swagger-ui.html).
// Các trang chỉ gọi qua đây; tên hàm giữ nguyên từ bản giao diện chạy dữ liệu giả để không phải sửa trang.
import { del, get, patch, post } from '@/services/httpClient'
import { useAuth } from '@/stores/authStore'

/** Tên tập dữ liệu ở FE -> đường dẫn REST. */
const PATHS = {
  users: '/users', roles: '/roles', categories: '/categories', tags: '/tags', items: '/items', ingredients: '/ingredients',
  floors: '/floors', areas: '/areas', tables: '/tables', vouchers: '/vouchers', shifts: '/shifts', schedules: '/schedules',
  reservations: '/reservations', orders: '/orders', orderItems: '/order-items', bills: '/bills', reviews: '/reviews',
  inventoryTx: '/inventory-transactions', serviceRequests: '/service-requests', chatSessions: '/chat-sessions',
}
function path(col) {
  if (!PATHS[col]) throw new Error(`Không có API cho "${col}"`)
  return PATHS[col]
}

export const api = {
  list: (col) => get(path(col)),
  create: (col, data) => post(path(col), data),
  // Đánh giá chỉ đổi được trạng thái ẩn/hiện (kiểm duyệt), không sửa nội dung của khách
  update: (col, id, data) => (col === 'reviews' ? patch(`/reviews/${id}/visibility`, { hidden: data.hidden }) : patch(`${path(col)}/${id}`, data)),
  remove: (col, id) => del(`${path(col)}/${id}`),

  // Tài khoản
  login: (login, password, kind) => post('/auth/login', { login, password, kind }),
  register: (data) => post('/auth/register', data),
  logout: () => post('/auth/logout'),

  // Bàn và đơn
  openTable: (tableId, { guestCount, reservationId = null, customerId = null }) => post(`/tables/${tableId}/open`, { guestCount, reservationId, customerId }),
  setTableStatus: (tableId, status) => post(`/tables/${tableId}/status`, { status }),
  moveTable: (orderId, toTableId) => post(`/orders/${orderId}/move`, { toTableId }),
  addOrderItems: ({ orderId, tableId, type = 'DINE_IN', lines, source = 'STAFF' }) =>
    post('/orders/items', { orderId, tableId, type, source, lines: lines.map(({ itemId, qty, note, source: s }) => ({ itemId, qty, note, source: s })) }),
  cancelOrder: (orderId) => post(`/orders/${orderId}/cancel`),
  cancelOrderItem: (id) => post(`/order-items/${id}/cancel`),

  // Khách tại bàn (quét QR)
  tableByQr: (qrToken) => get(`/table-sessions/table?qrToken=${encodeURIComponent(qrToken)}`),
  joinTable: (qrToken) => post('/table-sessions/join', { qrToken }),
  createServiceRequest: (qrToken, type) => post('/table-sessions/request', { qrToken, type }),
  ackRequest: (id) => post(`/service-requests/${id}/ack`),
  doneRequest: (id) => post(`/service-requests/${id}/done`),

  // Thanh toán
  billPreview: (orderId, { voucherId, pointsUsed = 0 } = {}) =>
    get(`/orders/${orderId}/bill-preview?pointsUsed=${pointsUsed}${voucherId ? `&voucherId=${voucherId}` : ''}`),
  payBill: (orderId, { voucherId = null, pointsUsed = 0, method }) => post(`/orders/${orderId}/pay`, { voucherId, pointsUsed, method }),
  voidBill: (id) => post(`/bills/${id}/void`),

  // Đặt bàn
  availability: (from, to) => get(`/reservations/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  setReservationStatus: (id, status) => post(`/reservations/${id}/status`, { status }),

  // Tầng, bàn, vai trò
  bulkAddTables: (body) => post('/tables/bulk', body),
  regenerateQr: (tableId) => post(`/tables/${tableId}/regenerate-qr`),
  cloneRole: (fromId, { code, name }) => post(`/roles/${fromId}/clone`, { code, name }),

  // Trợ lý AI
  chat: (sessionId, message) => post('/chat', { sessionId, message }),
  chatFeedback: (sessionId, value, addedToCart = false) => post(`/chat/${sessionId}/feedback`, { value, addedToCart }),
  aiModel: () => get('/ai/model'),
  retrain: () => post('/ai/retrain'),
}

/** Đăng nhập rồi lưu phiên; trả người dùng để trang điều hướng. */
export async function signIn(login, password, kind) {
  const r = await api.login(login, password, kind)
  useAuth.getState().setSession(r)
  return r.user
}

/** Thu hồi refresh token ở máy chủ (lỗi mạng vẫn xóa phiên phía trình duyệt). */
export async function signOut() {
  await api.logout().catch(() => {})
  useAuth.getState().clearSession()
}
