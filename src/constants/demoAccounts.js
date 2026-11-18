// Tài khoản có trong dữ liệu demo của BE (db/demo/V2__demo_seed.sql), mật khẩu 123456. Chỉ hiện ở chế độ dev để chọn nhanh khi trình bày.
export const DEMO_PASSWORD = '123456'
export const DEMO_STAFF = import.meta.env.DEV ? [
  { email: 'thong.admin0@nhahang.vn', label: 'Admin Hệ Thống · Quản trị' },
  { email: 'quan.le1@nhahang.vn', label: 'Lê Minh Quân · Quản lý' },
  { email: 'linh.do3@nhahang.vn', label: 'Đỗ Khánh Linh · Nhân viên' },
] : []
export const DEMO_CUSTOMERS = import.meta.env.DEV ? [
  { email: 'anhnguyen0@gmail.com', label: 'Nguyễn Minh Anh' },
  { email: 'baotran1@gmail.com', label: 'Trần Quốc Bảo' },
  { email: 'trangle2@gmail.com', label: 'Lê Thu Trang' },
] : []
