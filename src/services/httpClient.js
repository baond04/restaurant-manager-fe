// Gọi REST của Spring Boot (/api/v1). Dev: Vite chuyển /api sang http://localhost:8080 (vite.config.js) nên cookie refresh cùng origin.
// Access token chỉ giữ trong bộ nhớ (authStore); refresh token nằm ở cookie HttpOnly, trình duyệt tự gửi tới /api/v1/auth.
import { useAuth } from '@/stores/authStore'

const BASE = '/api/v1'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/** Token dùng cho request: trang gọi món tại bàn (/t/...) dùng token khách tại bàn, còn lại dùng token đăng nhập. */
function currentToken() {
  const s = useAuth.getState()
  return window.location.pathname.startsWith('/t/') ? s.tableToken : s.token
}

async function send(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'same-origin',
    headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 204) return null
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  // BE trả lỗi dạng RFC 7807 (ProblemDetail): thông báo tiếng Việt nằm ở detail
  if (!res.ok) throw new ApiError(res.status, data?.detail || data?.title || `Lỗi ${res.status}`)
  return data
}

let refreshing = null
/** Đổi cookie refresh lấy access token mới; nhiều request cùng hết hạn thì chỉ gọi một lần. */
export function refreshSession() {
  refreshing ??= send('POST', '/auth/refresh')
    .then((r) => { useAuth.getState().setSession(r); return r })
    .catch(() => { useAuth.getState().clearSession(); return null })
    .finally(() => { refreshing = null })
  return refreshing
}

export async function http(method, path, body) {
  const onTablePage = window.location.pathname.startsWith('/t/')
  try {
    return await send(method, path, body, currentToken())
  } catch (e) {
    // Access token hết hạn (15 phút): làm mới một lần rồi gửi lại. Token khách tại bàn không làm mới được.
    if (e.status !== 401 || onTablePage || path.startsWith('/auth/') || !useAuth.getState().token) throw e
    if (!(await refreshSession())) throw e
    return send(method, path, body, currentToken())
  }
}

export const get = (path) => http('GET', path)
export const post = (path, body = {}) => http('POST', path, body)
export const patch = (path, body) => http('PATCH', path, body)
export const del = (path) => http('DELETE', path)
