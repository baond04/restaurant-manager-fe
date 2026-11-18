import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/services/api'
import { useAuth } from '@/stores/authStore'

/**
 * Danh sách một bảng. Trả [] khi đang tải hoặc không có quyền đọc, để trang không phải kiểm tra undefined.
 * Khóa truy vấn gồm người dùng: đổi tài khoản thì không dùng lại dữ liệu của người trước.
 * shortcut: làm mới 10 giây/lần thay cho WebSocket (yêu cầu tại bàn, món mới hiện chậm tối đa 10 giây); cần tức thời thì thêm STOMP.
 */
export function useCol(col, { enabled = true } = {}) {
  const who = useAuth((s) => (window.location.pathname.startsWith('/t/') ? `table:${s.tableToken}` : s.user?.id ?? 'guest'))
  const ready = useAuth((s) => s.ready)
  const q = useQuery({ queryKey: ['db', col, who], queryFn: () => api.list(col), enabled: enabled && ready, refetchInterval: 10_000, retry: false })
  return { ...q, data: q.data ?? [], isLoading: q.isLoading || !ready }
}

export function useAiModel() {
  return useQuery({ queryKey: ['db', 'aiModel'], queryFn: api.aiModel })
}

/**
 * Bọc một lời gọi api: báo lỗi bằng toast, làm mới mọi danh sách khi xong.
 * const run = useRun(); await run(() => api.payBill(...), 'Đã thanh toán')
 */
export function useRun() {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: ({ fn }) => fn(),
    // Không return ở onSuccess, onError: mutation sẽ chờ theo giá trị trả về.
    onSuccess: (_d, { ok }) => { if (ok) toast.success(ok) },
    onError: (e) => { toast.error(e.message) },
    onSettled: () => qc.invalidateQueries({ queryKey: ['db'] }),
  })
  return Object.assign((fn, ok) => m.mutateAsync({ fn, ok }), { pending: m.isPending })
}

export const byId = (rows) => Object.fromEntries(rows.map((r) => [r.id, r]))
