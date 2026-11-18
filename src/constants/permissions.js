// Danh mục quyền (spec mục 2.1). BE trả cùng cấu trúc qua GET /permissions.
export const PERMISSION_GROUPS = [
  { code: 'overview', name: 'Tổng quan và báo cáo', perms: [
    ['dashboard:view', 'Xem trang Tổng quan'],
    ['report:view', 'Xem trang Báo cáo'],
    ['report:export', 'Xuất báo cáo CSV, Excel'],
  ] },
  { code: 'table', name: 'Bàn và tầng', perms: [
    ['table:view', 'Xem sơ đồ bàn'],
    ['table:operate', 'Mở bàn, chuyển bàn, đổi trạng thái bàn'],
    ['floor:manage', 'Thêm, sửa tầng, khu vực, bàn; đổi mã QR'],
  ] },
  { code: 'reservation', name: 'Đặt bàn', perms: [
    ['reservation:view', 'Xem danh sách đặt bàn'],
    ['reservation:manage', 'Tạo, sửa, xác nhận, check-in, hủy đặt bàn'],
  ] },
  { code: 'order', name: 'Gọi món và phục vụ', perms: [
    ['order:view', 'Xem đơn đang mở'],
    ['order:create', 'Gọi món hộ khách'],
    ['order:cancel_item', 'Hủy món trong đơn đang mở'],
    ['request:handle', 'Nhận và xử lý yêu cầu của khách'],
  ] },
  { code: 'bill', name: 'Thanh toán', perms: [
    ['bill:view', 'Xem hóa đơn'],
    ['bill:pay', 'Thu tiền, in hóa đơn'],
    ['bill:discount', 'Áp voucher, dùng điểm'],
    ['bill:void', 'Hủy hóa đơn đã thanh toán'],
  ] },
  { code: 'menu', name: 'Thực đơn', perms: [
    ['menu:view', 'Xem thực đơn'],
    ['menu:write', 'Thêm, sửa, xóa món, danh mục, tag; báo hết món'],
  ] },
  { code: 'inventory', name: 'Kho', perms: [
    ['inventory:view', 'Xem tồn kho'],
    ['inventory:write', 'Nhập, xuất, điều chỉnh kho'],
  ] },
  { code: 'staff', name: 'Nhân sự', perms: [
    ['staff:view', 'Xem nhân viên và lịch ca'],
    ['staff:manage', 'Thêm, sửa, xóa nhân viên'],
    ['schedule:manage', 'Xếp ca, gán khu vực'],
    ['schedule:view_own', 'Xem lịch làm của mình'],
  ] },
  { code: 'promo', name: 'Khuyến mãi và khách', perms: [
    ['voucher:manage', 'Thêm, sửa, xóa voucher'],
    ['customer:view', 'Xem khách hàng, điểm'],
    ['review:moderate', 'Ẩn đánh giá vi phạm'],
  ] },
  { code: 'ai', name: 'Trợ lý AI', perms: [
    ['ai:view', 'Xem hội thoại, chỉ số'],
    ['ai:manage', 'Huấn luyện lại mô hình gợi ý'],
  ] },
  { code: 'system', name: 'Hệ thống', perms: [
    ['user:manage', 'Thêm, sửa, khóa tài khoản'],
    ['role:manage', 'Thêm, sửa vai trò và quyền'],
  ] },
]

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.perms.map(([code]) => code))
export const PERMISSION_LABEL = Object.fromEntries(PERMISSION_GROUPS.flatMap((g) => g.perms))

// Menu nhân viên: trang hiện khi người dùng có ít nhất một quyền trong `any` (spec 2.2).
export const STAFF_NAV = [
  { path: 'dashboard', label: 'Tổng quan', icon: 'LayoutDashboard', group: 'Vận hành', any: ['dashboard:view'] },
  { path: 'tables', label: 'Sơ đồ bàn', icon: 'Armchair', group: 'Vận hành', any: ['table:view'] },
  { path: 'pos', label: 'Gọi món', icon: 'ClipboardList', group: 'Vận hành', any: ['order:create'] },
  { path: 'service', label: 'Yêu cầu của khách', icon: 'ConciergeBell', group: 'Vận hành', any: ['request:handle'] },
  { path: 'reservations', label: 'Đặt bàn', icon: 'CalendarDays', group: 'Vận hành', any: ['reservation:view'] },
  { path: 'bills', label: 'Hóa đơn', icon: 'ReceiptText', group: 'Vận hành', any: ['bill:view'] },
  { path: 'reports', label: 'Báo cáo', icon: 'ChartColumn', group: 'Quản lý', any: ['report:view'] },
  { path: 'menu', label: 'Thực đơn', icon: 'BookOpen', group: 'Quản lý', any: ['menu:view'] },
  { path: 'inventory', label: 'Kho nguyên liệu', icon: 'Package', group: 'Quản lý', any: ['inventory:view'] },
  { path: 'floors', label: 'Tầng và bàn', icon: 'Building2', group: 'Quản lý', any: ['floor:manage'] },
  { path: 'staff', label: 'Nhân viên và ca', icon: 'Users', group: 'Quản lý', any: ['staff:view', 'schedule:manage'] },
  { path: 'vouchers', label: 'Voucher', icon: 'Ticket', group: 'Quản lý', any: ['voucher:manage'] },
  { path: 'customers', label: 'Khách và đánh giá', icon: 'Star', group: 'Quản lý', any: ['customer:view', 'review:moderate'] },
  { path: 'ai', label: 'Trợ lý AI', icon: 'Sparkles', group: 'Quản lý', any: ['ai:view'] },
  { path: 'users', label: 'Người dùng', icon: 'UserCog', group: 'Hệ thống', any: ['user:manage'] },
  { path: 'roles', label: 'Vai trò và quyền', icon: 'ShieldCheck', group: 'Hệ thống', any: ['role:manage'] },
  { path: 'my-schedule', label: 'Lịch làm của tôi', icon: 'CalendarClock', group: 'Cá nhân', any: ['schedule:view_own'] },
]

export const canSee = (nav, perms) => nav.any.some((p) => perms.includes(p))
