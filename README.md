# Nhà Hàng Cam: frontend

React 19 + Vite, Ant Design 6, React Router 8, TanStack Query, Zustand, Recharts, icon Lucide. Thiết kế đầy đủ ở `docs/superpowers/specs/2026-11-08-restaurant-system-design.md`.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # test tính tiền (vitest)
npm run lint
```

| Đường dẫn | Dành cho |
|---|---|
| `/` | Khách: trang chủ, thực đơn, đặt bàn, tài khoản (`/login` có tài khoản demo) |
| `/staff/login` | Nhân viên: chọn tài khoản demo theo vai trò, menu đổi theo quyền |
| `/t/<mã QR>` | Khách gọi món tại bàn. Lấy link ở Sơ đồ bàn → bấm một bàn → "Mở trang gọi món của bàn" |

## Dữ liệu

Chưa có backend. `src/shared/api/api.js` là API giả, đọc ghi localStorage (dữ liệu mẫu 60 ngày ở `src/shared/mock/seed.js`). Hai tab cùng trình duyệt thấy thay đổi của nhau, ví dụ khách bấm "Cần hỗ trợ" thì trang Phục vụ hiện ngay. Đặt lại dữ liệu: menu tài khoản góc phải → "Đặt lại dữ liệu demo".

Khi nối backend: thay thân các hàm trong `api.js` bằng lời gọi Axios tới `/api/v1` (mục 8 của thiết kế). Các trang dùng `useCol` và `useRun` trong `src/shared/api/hooks.js` nên không phải sửa.
