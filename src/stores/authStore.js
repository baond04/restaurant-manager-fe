import { create } from 'zustand'

// Một phiên đăng nhập mỗi trình duyệt (nhân viên HOẶC khách). Access token chỉ ở bộ nhớ; tải lại trang thì
// AuthBootstrap (providers) đổi cookie refresh HttpOnly lấy token mới. tableToken: token khách tại bàn sau khi quét QR.
export const useAuth = create((set) => ({
  token: null,
  user: null,
  perms: [],
  ready: false, // đã thử khôi phục phiên lúc mở trang
  tableToken: null,
  setSession: (r) => set({ token: r.accessToken, user: r.user, perms: [...r.permissions], ready: true }),
  clearSession: () => set({ token: null, user: null, perms: [], ready: true }),
  setTableToken: (tableToken) => set({ tableToken }),
}))

/** Nhân viên đang đăng nhập kèm quyền (quyền lấy từ token, máy chủ vẫn kiểm lại ở mọi API). */
export function useStaff() {
  const { user, perms, ready } = useAuth()
  const staff = user?.kind === 'STAFF' ? user : null
  const p = staff ? perms : []
  return { user: staff, perms: p, can: (x) => p.includes(x), loading: !ready }
}

export function useCustomer() {
  const user = useAuth((s) => s.user)
  return user?.kind === 'CUSTOMER' ? user : null
}
