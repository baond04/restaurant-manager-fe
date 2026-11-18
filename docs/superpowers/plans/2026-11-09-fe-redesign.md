# Plan làm lại frontend: bố cục, công nghệ, luồng khách tại bàn

Ngày 09/11/2026. Trạng thái: **giai đoạn 1 và 2 đã xong trên nhánh `redesign/fe`, chưa commit, đang chờ duyệt 3 màn mẫu (bước 2.5).** Bổ sung cho `docs/superpowers/specs/2026-11-08-restaurant-system-design.md`.

---

## 1. Vì sao bản hiện tại xấu

| Vấn đề | Cụ thể | Hướng sửa |
|---|---|---|
| Không có cá tính | Nền trắng, bảng trắng, viền xám. Cam chỉ xuất hiện ở vài nút. Đổi logo đi là không biết của ai | Dùng cam thành khối lớn có chủ đích (mục 4) |
| Mọi trang một khuôn | Tiêu đề, thanh lọc, bảng. Trang vận hành và trang danh mục trông y hệt | Mỗi nhóm trang có bố cục riêng (mục 5) |
| Bàn là danh sách ô, không phải sơ đồ | Không thấy vị trí, hình bàn, số ghế | Sơ đồ thật theo mặt bằng, ghế vẽ quanh bàn |
| Dùng antd rồi vá CSS | Dropdown, bảng, form vẫn mang dáng antd; muốn đổi sâu phải đè `!important` | Sở hữu mã nguồn component (mục 3) |
| Không có chuyển động, trạng thái tải | Dữ liệu hiện đột ngột, thao tác không có phản hồi tại chỗ | Skeleton, cập nhật lạc quan, chuyển động ngắn |
| Luồng khách thiếu | Khách đã đăng nhập không gọi món được, hệ thống không biết họ ngồi bàn nào | Mục 2 |

**Lỗi nghiệp vụ tìm thấy khi rà:**

- Trang `/t/:qrToken` đang cho gọi món cả khi bàn chưa mở, trái với spec mục 5.5.
- Đặt bàn chỉ kiểm tra trùng ở trình duyệt. `api.create('reservations')` không kiểm tra lại, hai người chọn cùng bàn cùng giờ đều đặt được.
- Kiểm tra bàn trống chỉ xét lượt đặt, không xét bàn đang có khách ngồi. Đặt lúc 18:30 cho 19:00 vẫn chọn được bàn đang có khách.
- Bàn chỉ chuyển sang "Đã đặt" tại lúc xác nhận nếu còn dưới 2 giờ. Lượt đặt xa hơn thì đến giờ bàn vẫn hiện "Trống".

---

## 2. Nghiệp vụ: khách gọi món và biết khách ngồi bàn nào

### 2.1 Các hệ thống thật làm thế nào

- **Toast:** mỗi bàn một mã QR riêng. Phục vụ mở đơn trên POS, khách quét QR là vào đúng đơn đó và gọi thêm. Nhiều người cùng quét thì gọi chung một đơn, **tên từng khách hiện trên phiếu**. Điểm thưởng ghép theo email lúc thanh toán.
- **Sapo FnB, iPOS, CukCuk:** khách quét QR gọi món; phục vụ nhận thông báo, cả yêu cầu thanh toán và gọi nhân viên.
- **Chống gọi từ xa:** các hệ thống dùng một hoặc nhiều lớp: nhân viên kích hoạt bàn trước, mã PIN theo phiên bàn, đơn dùng chung để cả bàn thấy món lạ.

### 2.2 Nguyên tắc

**Bàn gắn với "phiên bàn", không gắn với tài khoản.** Nhân viên mở bàn tạo ra một đơn đang mở. Ai vào bàn bằng cách nào cũng là thành viên của phiên đó. Tài khoản chỉ thêm quyền lợi: tích điểm, gợi ý cá nhân, lọc dị ứng.

### 2.3 Bốn cách vào bàn

| # | Ai | Cách | Hệ thống biết bàn nhờ |
|---|---|---|---|
| A | Khách vãng lai | Quét QR bằng camera điện thoại, mở `/t/{qrToken}`. Không cần đăng nhập | `qrToken` |
| B | Khách đã đăng nhập, đang dùng web | Nút **Gọi món tại bàn** trên trang chủ và thực đơn, mở máy quét QR ngay trong trang | `qrToken` + tài khoản |
| C | Khách đã đăng nhập, camera lỗi | Trong cùng màn hình, chọn **Nhập mã bàn**: mã bàn (T02) + PIN 4 số do phục vụ đọc | Mã bàn + PIN của phiên |
| D | Khách đã đặt bàn | Phục vụ bấm **Nhận bàn**. Tài khoản khách tự vào phiên, trang khách hiện ngay thanh **Bạn đang ở bàn T02** | `reservations.customer_id` |

Thêm một cách phía nhân viên: **Gắn khách** trong ngăn kéo bàn, tìm theo số điện thoại, dùng khi khách quen không muốn mở điện thoại. Khách đang vãng lai bấm **Đăng nhập để tích điểm** ngay trong trang bàn, không mất giỏ.

PIN chỉ cần ở cách C, vì mã bàn gõ tay đoán được từ xa. Cách A giữ đúng yêu cầu: quét QR là xong.

### 2.4 Trạng thái khi vào bàn

| Tình huống | Khách thấy |
|---|---|
| Bàn đã mở | Vào gọi món, đầu trang ghi bàn và tầng |
| Bàn chưa mở | Xem thực đơn được, chưa gọi được. Nút **Báo nhân viên mở bàn** tạo yêu cầu cho trang Phục vụ. Tự vào khi bàn được mở |
| Mã QR đã đổi hoặc bàn ngừng dùng | "Mã không còn hiệu lực" |
| Đang ở bàn khác | Hỏi "Rời bàn T02 để sang T05?" |
| Đơn đã thanh toán | Màn hình cảm ơn, điểm nhận được, đánh giá món. Phiên hết hiệu lực |
| Chuyển bàn | Tự cập nhật tên bàn, không phải quét lại |

### 2.5 Gọi món chung

- Giỏ riêng trên từng điện thoại. **Đơn của bàn dùng chung**, ai cũng thấy.
- Mỗi món ghi người gọi. Khách vãng lai đặt tên khi vào (mặc định "Khách 1").
- Món gửi bếp hiện theo thời gian thực: Chờ, Đang nấu, Sẵn sàng, Đã mang ra.
- Tạm tính toàn bàn và phần của tôi.
- Điểm: nhân viên chọn thành viên nhận điểm, mặc định người đăng nhập đầu tiên.

### 2.6 Thực đơn khi có và không có phiên bàn

| | Chưa vào bàn | Đang ở bàn |
|---|---|---|
| Nút trên món | Nút **+** thêm vào giỏ nháp | Nút **+** thêm vào giỏ |
| Thanh dưới | Giỏ nháp: **Đặt bàn kèm món** hoặc **Quét QR tại bàn** | Giỏ: 3 món · 245.000đ · **Gửi bếp** |
| Đầu trang | Bình thường | Dải cam: Bàn T02 · Tầng 2 |

Khách đang ở bàn đi tới trang nào cũng thấy dải này, bấm là về trang gọi món.

### 2.7 Thay đổi dữ liệu và API (cập nhật spec)

```
table_session_members(id, order_id FK, customer_id FK NULL, display_name,
                      join_method ENUM('QR','PIN','RESERVATION','STAFF'), joined_at, left_at)
orders            + table_pin CHAR(4)        -- sinh khi mở bàn, chỉ nhân viên thấy
order_items       + member_id FK NULL        -- ai gọi
bills             + points_member_id FK NULL -- ai nhận điểm
dining_tables     + pos_x, pos_y, shape ENUM('ROUND','SQUARE','RECT') -- sơ đồ thật
areas             + plan_w, plan_h           -- kích thước khu vực trên sơ đồ
```

```
POST /table-sessions/join        { qrToken, displayName? }       -- có Bearer thì gắn tài khoản
POST /table-sessions/join-code   { tableCode, pin }              -- tối đa 5 lần sai mỗi 10 phút
GET  /me/table-session           -- trang khách hỏi khi mở; 204 nếu không ở bàn nào
POST /table-sessions/leave
POST /table-sessions/{orderId}/members/link-customer             -- nhân viên gắn khách
```

Topic mới: `/topic/orders/{id}` thêm sự kiện thành viên vào, chuyển bàn; `/user/queue/notify` thêm "đã nhận bàn".

### 2.8 Chức năng còn thiếu, xếp theo ưu tiên

| Ưu tiên | Chức năng |
|---|---|
| Bắt buộc | Bốn cách vào bàn, gọi món chung, chặn gọi khi bàn chưa mở |
| Bắt buộc | Màn hình hóa đơn cho khách: xem chi tiết, yêu cầu thanh toán, hiện VietQR |
| Bắt buộc | Tuỳ chọn món (cỡ, độ cay, thêm topping) trong màn chi tiết món |
| Bắt buộc | Thông báo cho khách: bàn đã mở, món sẵn sàng, lượt đặt bị nhà hàng hủy |
| Bắt buộc | Giỏ nháp và đặt món trước kèm lượt đặt bàn (mục 2.9) |
| Nên có | Gọi lại món đã từng ăn, món yêu thích |
| Để sau | Mang đi đặt online, giao hàng, chia hóa đơn, đặt cọc |

### 2.9 Khách chưa ở nhà hàng, hoặc chưa có bàn

**Quy tắc: ai cũng chọn món được, nhưng món chỉ vào bếp khi đã có phiên bàn do nhân viên mở.**

| Tình huống | Hệ thống xử lý |
|---|---|
| Ở nhà, chưa đặt bàn | Món vào giỏ nháp trên thiết bị. Nút chính: **Đặt bàn kèm các món này** |
| Ở nhà, đã đặt bàn | Món lưu vào lượt đặt, hiện trong chi tiết lượt đặt. Bếp xem được để chuẩn bị nguyên liệu, chưa nấu |
| Đến nơi, có đặt bàn | Nhân viên bấm **Nhận bàn**. Món đặt trước hiện trong phiên bàn để khách sửa rồi **Gửi bếp** |
| Đến nơi, chưa có bàn | Giỏ vẫn giữ. Nhân viên xếp bàn, khách quét QR, giỏ nháp tự vào bàn đó |
| Món đặt trước đã hết hoặc đổi giá | Khi gửi bếp: hiện dòng "Hết món", giá lấy theo hiện tại |

Không nấu trước khi khách đến: khách trễ thì món hỏng, khách không đến thì nhà hàng không mất gì. Vì vậy đặt món trước không cần đặt cọc.

Dữ liệu: `reservation_items(id, reservation_id FK, item_id FK, quantity, note)`. Giỏ nháp nằm ở Zustand persist (`rm-cart`), mỗi thiết bị một giỏ. Gửi bếp dùng lại `addOrderItems`.

### 2.10 Thanh toán sau khi ăn xong

Trả một lần cuối bữa. Khách bấm **Yêu cầu thanh toán**, xem hóa đơn và VietQR, nhân viên xác nhận đã nhận tiền.

Lý do: khách gọi nhiều đợt và chung một đơn; phí dịch vụ, chi tối thiểu, voucher, điểm, VAT đều tính trên tổng cuối; spec không có cổng thanh toán nên trả trước từng đợt thì đợt nào nhân viên cũng phải kiểm tra tiền về.

**Không làm đặt cọc đợt này**, kể cả phòng VIP: cọc buộc nhân viên xác nhận tiền, ngược với quy tắc đặt bàn tự xác nhận ở mục 2.11. Cột `deposit_amount` để nguyên, chưa dùng.

### 2.11 Đặt bàn tự xác nhận

Khách chọn được bàn nghĩa là bàn trống trong khung giờ đó, nên **đặt xong là xác nhận luôn, không cần quản lý duyệt**.

Vòng trạng thái mới: `CONFIRMED → SEATED → COMPLETED`, nhánh `CANCELLED`, `NO_SHOW`. Bỏ `PENDING` và thao tác Xác nhận, Từ chối.

Vì không còn người duyệt, máy chủ phải tự làm phần người duyệt từng làm:

| Kiểm tra | Cách làm | Nếu sai |
|---|---|---|
| Hai người đặt cùng lúc | Trong một transaction, khóa các dòng `dining_tables` đã chọn theo thứ tự id (`SELECT ... FOR UPDATE`), kiểm tra trùng ±2 giờ, rồi mới tạo | 409 "Bàn T02 vừa có người đặt". Giao diện tải lại lưới bàn, giữ thông tin đã nhập |
| Bàn đang có khách | Giờ đến cách hiện tại dưới 2 giờ thì bàn `OCCUPIED`, `CLEANING` tính là bận | Không cho chọn bàn đó |
| Bàn ngừng dùng, đủ chỗ, VIP từ 10 khách | Làm lại ở máy chủ, không tin trình duyệt | 400 kèm lý do |
| Trước ít nhất 30 phút, trong giờ mở cửa, tối đa 60 ngày | Như trên | 400 kèm lý do |
| Một người giữ hết bàn | Tài khoản tối đa 2 lượt đang hiệu lực; khách không đăng nhập tối đa 1 lượt theo số điện thoại; giới hạn số lần gọi theo IP | 429 hoặc 400 kèm lý do |

Quy tắc đi kèm:

- **Bàn "Đã đặt" là giá trị tính ra, không lưu.** Có lượt `CONFIRMED` trong 2 giờ tới thì sơ đồ hiện "Đã đặt", sửa được lỗi bàn không đổi trạng thái khi đến giờ.
- **Giữ bàn 15 phút.** Quá giờ, dòng lượt đặt hiện "Trễ 15 phút" và nút **Không đến**; bấm xong bàn trống ngay. Nhân viên bấm tay, không tự hủy.
- **Nhân viên vẫn sửa, nhận bàn, hủy được.** Hủy phải chọn lý do, khách nhận thông báo.
- **Khách thấy:** "Đặt bàn thành công" kèm bàn, giờ, không còn "Đã gửi yêu cầu".
- Số đếm trên menu Đặt bàn đổi thành số lượt hôm nay chưa đến.

Phần phải sửa: `BookingPage.jsx:48,54`, `ReservationsPage.jsx:14,47,86`, `AccountPage.jsx:43`, `DashboardPage.jsx:19`, `StaffLayout.jsx:22`, `booking.js:4`, `constants.js:9`, `seed.js:214,224`, `api.js:192`; thêm `api.createReservation`; đổi khóa dữ liệu mẫu sang `rm-demo-v10`. Spec dòng 71, 384, 449, 514, 550, 613.

Rủi ro chấp nhận: không có OTP nên số điện thoại giả vẫn giữ được bàn tới hết 15 phút.

### 2.12 Gộp thu ngân và phục vụ

Hai vai trò hiện chỉ khác 3 quyền. Gộp thành một vai trò hệ thống `STAFF`, tên **Nhân viên**, gồm quyền của `WAITER` cùng `bill:view`, `bill:pay`, `bill:discount`. Menu: Sơ đồ bàn, Gọi món, Phục vụ, Đặt bàn, Hóa đơn, Thực đơn (chỉ xem), Lịch làm của tôi.

- Chống thất thoát: hóa đơn luôn ghi người thu, **chỉ quản lý có `bill:void`**.
- Nhà hàng lớn vẫn tự tạo vai trò "Thu ngân" trong trang Vai trò và quyền.
- Giữ cột `bills.cashier_id`, chỉ đổi nhãn thành **Người thu**.

Phần phải sửa: `seed.js:28-29,39-42,164-165`, `BillsPage.jsx:83,93` (lọc theo người có trong hóa đơn thay vì `roleId === 3`), `ReportsPage.jsx:97` và spec dòng 21, 44-45, 126-127, 511, 551.

---

## 3. Công nghệ và cách dùng React

### 3.1 Quyết định chính: bỏ antd, dùng Tailwind + shadcn/ui

| | Giữ antd | **Tailwind 4 + shadcn/ui (đề xuất)** |
|---|---|---|
| Hình thức | Đổi màu dễ, đổi dáng khó | Mã component nằm trong repo, sửa được mọi chi tiết |
| Bảng, form lớn | Có sẵn, mạnh | Tự ghép từ TanStack Table và React Hook Form |
| Chi phí | Thấp | Viết lại phần giao diện của 26 trang (khoảng 2.800 dòng) |

Lý do chọn: yêu cầu lớn nhất lúc này là đẹp và có bản sắc. Phần logic (`api.js`, `hooks.js`, tính tiền, dữ liệu mẫu, phân quyền) giữ nguyên.

Bản dashboard mẫu của shadcn cũng rất trung tính. **Chỉ đổi thư viện thì chưa đẹp hơn**; phần tạo khác biệt là mục 4 và 5.

### 3.2 Bộ thư viện

| Việc | Dùng | Ghi chú |
|---|---|---|
| Nền | React 19, Vite 8, React Router 8 | Giữ |
| Style | Tailwind CSS 4.3, token trong `@theme` | Mới |
| Component | Viết tay theo mẫu shadcn trên `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge` | `src/components/ui`, bằng JSX, dùng token riêng. Không chạy CLI vì CLI sinh token và kiểu mặc định phải sửa lại hết |
| Bảng | TanStack Table 8 | Bản đã có ví dụ chạy trong repo tham khảo. Chưa thử bản 9 |
| Form | React Hook Form 7 + Zod 4 | Schema dùng chung cho kiểm tra dữ liệu |
| Dữ liệu | TanStack Query 5 | Giữ; thêm cập nhật lạc quan |
| State | Zustand 5 | Giữ; thêm giỏ món, phiên bàn |
| Ngăn kéo dưới | vaul | Giỏ, chi tiết món trên điện thoại |
| Thông báo | sonner | Thay message antd |
| Chuyển động | motion | Chỉ chuyển trang, giỏ, danh sách đổi vị trí |
| Quét QR | `@yudiel/react-qr-scanner` | Cách B |
| Tạo QR | `qrcode.react` | Thay QRCode antd |
| Lịch | react-day-picker | Theo shadcn |
| Biểu đồ | Recharts | Giữ |
| Tìm nhanh | cmdk | Nhân viên bấm Ctrl+K đi tới bàn, món, trang |
| Icon | lucide-react | Giữ |
| Font | Be Vietnam Pro qua `@fontsource` | Tự host, không phụ thuộc Google Fonts |
| Kiểm thử | Vitest, Playwright | Thêm chụp ảnh so sánh giao diện |

Không thêm: Storybook (thay bằng trang `/dev/ui` tự viết), Redux, TypeScript (giữ JSX như đã chốt).

**Tailwind chạy chung antd trong lúc chuyển dần:** `src/index.css` khai báo `@layer theme, base, legacy, components, utilities`. CSS cũ chuyển sang `src/legacy.css` nằm trong lớp `legacy`, nên class Tailwind thắng CSS cũ, CSS cũ thắng reset. Antd chèn CSS không thuộc lớp nào nên không bị ảnh hưởng. Bảng màu mặc định của Tailwind bị xóa, chỉ còn token mục 4.2, viết nhầm `bg-blue-500` sẽ không có tác dụng.

### 3.3 Cách tổ chức React

```
src/
  app/          router, providers
  components/ui/         button, dialog, sheet...   (shadcn, sửa theo token)
  components/brand/      logo, status, money, dish-photo, table-shape
  components/data/       DataTable, FilterBar, RowActions, FormDialog
  layouts/      SiteLayout, StaffLayout, KitchenLayout
  features/<tên>/
    XxxPage.jsx Trang: lấy dữ liệu, ghép khối (giữ đường dẫn router hiện tại)
    components/ Khối giao diện: nhận props
    schema.js   Zod, khi trang có form
  shared/       api, auth, utils, mock
```

Hook dữ liệu giữ `useCol`, `useRun` trong `shared/api/hooks.js`, không tách theo tính năng vì dữ liệu giả dùng chung một nguồn.

| Quy tắc | Áp dụng |
|---|---|
| Trang chỉ ghép, khối chỉ hiển thị | File dưới 200 dòng |
| Bộ lọc nằm trên URL | `useSearchParams`, gửi link là giữ nguyên bộ lọc |
| Mọi danh sách có đủ trạng thái | Skeleton, trống, lỗi có nút thử lại |
| Thao tác nhanh cập nhật ngay | Thêm giỏ, đổi trạng thái món, bật tắt |
| Mỗi lỗi có ranh giới riêng | `errorElement` theo route |
| Tải theo trang | Giữ `lazy`, tách Recharts khỏi trang khách |

### 3.4 Học từ repo Supply_Chain_FrontEnd

Đã đọc mã nguồn commit `91c6ad7` (03/11/2026). Chưa chạy được vì cần backend, nên chưa thấy giao diện thật; nhận xét dưới đây chỉ dựa trên code.

**Repo dùng gì** (đếm số file có import):

| Việc | Thư viện | Số file | Với dự án mình |
|---|---|---|---|
| Khung style | Tailwind 3, biến màu CSS kiểu shadcn | toàn bộ | **Lấy**, dùng Tailwind 4 |
| Component nền | `src/components/ui/*.jsx` kiểu shadcn (radix, cva, `cn`) | 15 component | **Lấy cách làm** |
| Bảng | TanStack Table 8, một `DataTable` dùng chung | 48 file dùng | **Lấy** |
| Dữ liệu | TanStack Query | 7 | Đã có |
| Thông báo | sonner | 32 | **Lấy** |
| Chuyển động | framer-motion (nay là `motion`) | 86 | Lấy nhưng dùng ít |
| Icon | lucide-react | 155 | Đã có |
| Quét, tạo QR | html5-qrcode, qrcode.react | 2 | Cùng nhu cầu; mình chọn `@yudiel/react-qr-scanner` vì là component React |
| Build | Create React App + react-app-rewired | | **Không lấy**, giữ Vite |
| UI chồng nhau | Material Tailwind 28, MUI 22, antd 2, heroicons 19 | | **Không lấy**, mỗi việc một thư viện |
| Khai báo nhưng không import | jQuery, datatables, apexcharts, chart.js | 0 | **Không lấy** |
| Form | Có `react-hook-form` trong package.json nhưng 0 file import; form dùng `useState` | | Mình vẫn dùng React Hook Form + Zod để kiểm tra dữ liệu thống nhất giữa các form |

**Kết luận về công nghệ:** repo xác nhận hướng Tailwind + component kiểu shadcn viết bằng JSX chạy được trong đồ án thực tế. **Chốt bỏ antd.**

**Cách xếp div đáng học:**

| Mẫu | Trong repo | Vì sao tốt |
|---|---|---|
| Khung ứng dụng | `SideBarLayoutMT.jsx`: `flex h-screen overflow-hidden`, sidebar `flex-shrink-0`, phần phải `flex-1 flex flex-col min-w-0 overflow-hidden`, chỉ `main` cuộn | Menu và thanh trên đứng yên, chỉ nội dung cuộn. `min-w-0` giữ bảng rộng không làm vỡ trang |
| Sidebar | `flex flex-col`, đầu cố định, giữa `flex-1 overflow-y-auto`, chân `border-t`; rộng 280px, thu còn 80px | Ba tầng rõ ràng, menu dài không đẩy mất nút đăng xuất |
| Bảng | Hàng tìm kiếm trên cùng, `thead` dính, dòng khung xám khi tải, ô trống có icon, phân trang và chọn số dòng ở chân | Đủ trạng thái, một component cho mọi danh sách |
| Lọc theo trạng thái | `StatusSummaryCard`: nút lọc kèm số đếm | Vừa là số liệu vừa là bộ lọc |
| Tổng quan | `space-y-6`, KPI `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`, biểu đồ `lg:grid-cols-2 gap-6` | Nhịp đều, tự xuống hàng |
| Chi tiết | `grid-cols-1 lg:grid-cols-3 gap-6`, nội dung chính `lg:col-span-2` | Hai phần ba cho nội dung, một phần ba cho tóm tắt |
| Form | `grid-cols-1 md:grid-cols-2 gap-6` | Không kéo ô nhập quá dài |
| Điện thoại | `BottomNav` cố định, nút giữa nổi `-mt-6` | Hợp cho nút Giỏ hoặc Quét QR |
| Nhịp khoảng cách | Nhiều nhất là `gap-2`, `gap-4`, `gap-3`, `space-y-6`, `rounded-lg`, `shadow-sm` | Ít giá trị, nhìn đồng đều |

**Không học theo:**

| Trong repo | Vì sao | Mình làm |
|---|---|---|
| `ListPageLayout` bọc một thẻ trắng, `DataTable` bên trong lại một thẻ | Thẻ lồng thẻ, tốn lề | Một lớp thẻ |
| Xanh dương, tím, nhiều màu trạng thái | Trái yêu cầu hai màu | Mục 4.3 |
| Hiệu ứng kính, quả cầu bay, hạt ở trang đăng nhập | Nặng, không liên quan nghiệp vụ | Ảnh món thật |
| `thead` chữ hoa 15px, `bg-[#F0F1FA]` viết thẳng mã màu | Khó đọc, không theo token | Chữ thường 13px, token |
| `SideBarMT.jsx` 1.072 dòng, 700 dòng đầu là code cũ bị comment | Khó bảo trì | Sinh menu từ `STAFF_NAV`, file dưới 200 dòng |
| `<span onClick>` làm link | Không dùng được bằng bàn phím | `<Link>`, `<button>` |

Khung đúng không tự làm trang đẹp. Bố cục lấy từ repo; bản sắc đến từ mục 4 và 5.

### 3.5 Đặc tả thành phần

Mọi thành phần có viền focus 2px cam 700, cỡ chạm tối thiểu 40px trên điện thoại. Trang `/dev/ui` (chỉ có ở chế độ dev) hiển thị tất cả.

**`components/ui`: nền tảng**

| Thành phần | Giao diện sử dụng | Hình dáng và trạng thái |
|---|---|---|
| Button | `variant`: primary, secondary, outline, ghost, inverse, danger; `size`: sm 32, md 40, lg 48, icon; `loading`, `asChild` | Bo 10px; primary cam 700, rê chuột cam 800; inverse trắng chữ cam, dùng trên nền cam; bấm co 0.98; loading có vòng quay và khóa nút |
| Input, Textarea | Thuộc tính HTML, `aria-invalid` | Cao 40, viền cam 200, focus viền cam 700; lỗi viền đỏ |
| Field | `label`, `error`, `hint`, `children` | Nhãn 13px đậm 500 phía trên, lỗi đỏ phía dưới |
| Select | `value`, `onValueChange`, `options`, `placeholder`; option có `disabled` | Luôn là dropdown, dùng cho chọn giờ, số khách |
| Combobox | `value`, `onChange`, `options`, `placeholder` | Dropdown có ô tìm không dấu |
| Checkbox, Switch | `checked`, `onCheckedChange` | Bật là cam 700 |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Dạng viên, đang chọn nền trắng chữ cam |
| Dialog | `Dialog`, `DialogContent title description`, `DialogFooter` | Giữa màn hình, tối đa 90dvh, thân cuộn, chân dính |
| Sheet | `Sheet`, `SheetContent side title` | Trượt từ trái hoặc phải: menu điện thoại, chi tiết bàn dưới xl, trợ lý chat |
| Drawer | `Drawer`, `DrawerContent title` | Trượt từ dưới, có thanh kéo: giỏ, chi tiết món trên điện thoại |
| DropdownMenu | `DropdownMenu`, `Trigger`, `Content`, `Item` có `danger` | Menu thao tác |
| Popover | `Popover`, `Trigger`, `Content` | Lịch, chuông thông báo |
| Calendar | `selected`, `onSelect`, `disabled` | Tiếng Việt, tuần bắt đầu thứ Hai, ngày chọn cam 700 |
| DatePicker | `value`, `onChange`, `disabled` | Nút mở Popover chứa Calendar |
| Tooltip | `Tip label` | Nền nâu đen, chữ trắng |
| Badge | `tone`: soft, solid, outline, danger | Bo tròn, 12px |
| Skeleton | `className` | Khối cam 100 nhấp nháy |
| Command | `CommandPalette open onOpenChange groups` | Ctrl+K của nhân viên |

**`components/brand`: bản sắc**

| Thành phần | Giao diện sử dụng | Hình dáng |
|---|---|---|
| Logo | `tone`: brand, white; `compact` | Lát cam tròn vẽ bằng SVG, chữ Nhà Hàng Cam |
| Money | `value`, `className` | Số `tabular-nums`, đuôi đ |
| DishPhoto | `src`, `alt`, `className`, `zoom` | Ảnh phủ khung, phóng 1.03 khi rê chuột; ảnh lỗi thì hiện khối cam nhạt có icon |
| TableShape | `table`, `tone`, `dim`, `selected`, `alert`, `lines` | SVG mặt bàn và ghế theo số chỗ, xem mục 4.3 |
| ItemProgress | `status` | 4 đoạn cam: Chờ, Đang nấu, Sẵn sàng, Đã mang ra |
| StatusPill | `map`, `value` | Nhãn trạng thái một màu, đậm nhạt theo mức cần chú ý |
| QtyStepper | `value`, `onChange`, `min`, `label` | Nút trừ, số, nút cộng; số 0 thu về còn nút + |

**`components/data`: danh sách**

| Thành phần | Giao diện sử dụng | Ghi chú |
|---|---|---|
| ListPage | `title`, `actions`, `chips`, `filters`, `children` | Khung mục 5.0, một lớp thẻ |
| DataTable | `columns`, `data`, `loading`, `empty`, `onRowClick`, `pageSize` | `thead` dính, sắp xếp cột, dòng khung khi tải, phân trang và chọn số dòng |
| FilterBar | `search`, `onSearch`, `onReset`, `children` | Nền cam nhạt, nút Xóa lọc chỉ hiện khi đang lọc |
| StatusChips | `value`, `onChange`, `options` kèm `count` | Vừa là bộ lọc vừa là số liệu |
| RowActions | `onEdit`, `onDelete`, `deleteLabel`, `children` | Nút Sửa, Xóa có xác nhận |
| FormDialog | `open`, `title`, `onOpenChange`, `onSubmit`, `pending`, `children` | Thêm và sửa dùng chung |
| ConfirmDialog | `open`, `title`, `onConfirm`, `danger` | Thao tác không hoàn tác |
| EmptyState | `icon`, `title`, `action` | Không còn ảnh antd mặc định |

**Khối riêng của 3 màn mẫu**

| Khối | Vị trí | Việc |
|---|---|---|
| SiteLayout | `layouts` | Đầu trang dính, chân trang, thanh dưới trên điện thoại, nút trợ lý |
| StaffLayout | `layouts` | Sidebar cam, thanh trên có Ctrl+K, chuông, ca hiện tại |
| JoinTableSheet | `features/table-order/components` | Nút Gọi món tại bàn. Mẫu chỉ nhập mã bàn, máy quét và PIN làm ở bước 3.3 |
| ItemDetail | `features/customer/components` | Drawer trên điện thoại, Dialog trên máy tính |
| HomeHero, BookingBar, PopularMosaic, SpacesBlock | `features/customer/components` | Các khối trang chủ |
| FloorMap, TablePanel, MoveTableDialog | `features/tables/components` | Mặt bằng, chi tiết bàn, chuyển bàn |
| TableHeader, MenuList, CartBar, CartDrawer, OrderTab, HelpTab | `features/table-order/components` | Các khối trang tại bàn |

---

## 4. Hệ thống thiết kế: hai màu

**Trắng và cam.** Chữ dùng nâu đen pha từ chính sắc cam, nên không thấy thêm màu thứ ba. Đỏ chỉ dành cho lỗi và xóa.

### 4.1 Tỉ lệ

| Phần | Tỉ lệ | Dùng cho |
|---|---|---|
| Trắng | khoảng 70% | Nền, thẻ |
| Cam nhạt (50 đến 200) | khoảng 20% | Nền khu vực, ô đang chọn, thanh lọc |
| Cam đậm (600 đến 800) | khoảng 10% | Thanh menu nhân viên, khối hero, nút chính, số nổi bật |

### 4.2 Bảng màu đã đo tương phản

| Token | Mã | Chữ trên nền | Tỉ lệ | Dùng |
|---|---|---|---|---|
| `brand-50` | `#fff7ed` | `#c2410c` | 4.88 đạt | Nền khu vực |
| `brand-100` | `#ffedd5` | `#9a3412` | 6.38 đạt | Ô chọn, nhãn |
| `brand-200` | `#fed7aa` | `#7c2d12` | 6.92 đạt | Bàn đã đặt |
| `brand-500` | `#f97316` | `#1c1410` | 6.48 đạt | Biểu đồ, khối lớn chữ đen |
| `brand-600` | `#ea580c` | trắng | 3.56 **chỉ chữ từ 24px** | Mảng lớn, biểu đồ |
| `brand-700` | `#c2410c` | trắng | 5.18 đạt | Nút chính, thanh menu |
| `brand-800` | `#9a3412` | trắng | 7.31 đạt | Nút khi rê chuột |
| `ink` | `#1c1410` | trên trắng | 18.15 đạt | Chữ chính |
| `ink-soft` | `#6b5a4e` | trên trắng | 6.57 đạt | Chữ phụ |
| `mute` | `#efe9e3` | `ink-soft` | đạt | Bàn ngừng dùng, ô bị khóa |
| `danger` | `#b91c1c` | trắng | đạt | Lỗi, xóa |

### 4.3 Trạng thái chỉ bằng một màu

Thay cho xanh, vàng, đỏ, xanh dương trên sơ đồ bàn: **độ đậm của cam + hoa văn + chữ.**

| Trạng thái bàn | Hiển thị |
|---|---|
| Trống | Trắng, viền cam nhạt |
| Đã đặt | `brand-200`, viền đứt |
| Có khách | `brand-700`, chữ trắng |
| Có yêu cầu | Như có khách, thêm chấm trắng nhấp nháy |
| Đang dọn | Sọc chéo cam nhạt |
| Ngừng dùng | Xám nhạt |

Trạng thái món và đơn dùng thanh tiến độ cam theo bước, không dùng nhiều màu.

### 4.4 Chữ, khối, chuyển động

| Hạng mục | Quy định |
|---|---|
| Font | Be Vietnam Pro; số dùng `tabular-nums` |
| Cỡ khách | 56/40/28/20/16 |
| Cỡ nhân viên | 24/18/15/14/13 |
| Độ đậm | 800 tiêu đề lớn, 600 tiêu đề, 500 nhãn, 400 nội dung |
| Bo góc | Trang khách 20px; nhân viên 12px; nút 10px |
| Khoảng cách | Bội của 4px |
| Đổ bóng | Pha cam, nhẹ, chỉ khi rê chuột và lớp nổi |
| Rê chuột | Thẻ nổi 2px, ảnh phóng 1.03 |
| Bấm | Co 0.98 trong 100ms |
| Thêm món | Bay vào giỏ, số giỏ nảy |
| Không dùng | Hiệu ứng theo cuộn, nghiêng, tím, gradient màu lạ |

---

## 5. Bố cục từng trang

Tham khảo: ảnh trên Dribbble (Tasfin Hasan, Elinext, Tajrin Nahar, Suhayel Ahmed Nasim, Sakma Studio, Peno Lab) và shadcn dashboard là đã xem trực tiếp; Padella, Noma, Girl & the Goat là đọc qua phân tích của Magier, chưa mở từng trang. Chỉ học cấu trúc, không chép.

### 5.0 Công thức xếp div

Sáu quy tắc áp dụng cho mọi trang:

1. **Mỗi màn hình một vùng cuộn**, trừ khi màn đó chia cột làm việc như Gọi món.
2. Phần tử `flex` hoặc `grid` chứa bảng phải có `min-w-0`.
3. Lề trang: `mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8`.
4. Khoảng cách: `space-y-6` giữa các khối, `gap-4` lưới thẻ nhỏ, `gap-6` lưới thẻ lớn, `gap-2` trong cụm nút.
5. Luôn viết từ điện thoại lên: `grid-cols-1 md:… lg:…`.
6. Tối đa hai lớp hộp. Thẻ chuẩn: `rounded-xl border border-brand-100 bg-white`.

**Khung nhân viên** (`layouts/StaffLayout.jsx`):

```jsx
<div className="flex h-dvh overflow-hidden bg-brand-50">
  <aside className="hidden w-64 shrink-0 flex-col bg-brand-700 text-white lg:flex">
    <div className="flex h-16 shrink-0 items-center px-5">{logo}</div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-3">{menu}</nav>
    <div className="shrink-0 border-t border-white/20 p-3">{user}</div>
  </aside>
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-brand-100 bg-white px-4 lg:px-8">{title}{tools}</header>
    <main className="flex-1 overflow-y-auto"><Outlet /></main>
  </div>
</div>
```

**Trang danh sách** (`components/data/ListPage`), một lớp thẻ:

```jsx
<div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
  <div className="flex flex-wrap items-center justify-between gap-4">{title}{actions}</div>
  <div className="flex flex-wrap gap-2">{statusChipsWithCounts}</div>
  <div className="min-w-0 overflow-hidden rounded-xl border border-brand-100 bg-white">
    <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 bg-brand-50 p-4">{search}{filters}</div>
    <div className="overflow-x-auto"><table>{/* thead sticky top-0 */}</table></div>
    <div className="flex items-center justify-between border-t border-brand-100 px-4 py-3">{count}{pagination}</div>
  </div>
</div>
```

**Các khung còn lại:**

| Trang | Khung |
|---|---|
| Tổng quan | `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4`; khối doanh thu `md:col-span-2 xl:col-span-1 xl:row-span-1 bg-brand-700`; hàng dưới `grid gap-6 lg:grid-cols-3`, khối chính `lg:col-span-2` |
| Sơ đồ bàn | `flex h-full min-w-0`; mặt bằng `flex-1 overflow-auto relative`, mỗi bàn `absolute` theo `pos_x`, `pos_y`; ngăn chi tiết `w-80 2xl:w-96 shrink-0 border-l`; dưới `xl` thành `Sheet` vì 1024px không đủ chỗ cho cả mặt bằng |
| Gọi món | `grid h-full grid-cols-[180px_minmax(0,1fr)_380px]`, mỗi cột `overflow-y-auto`, chân đơn hàng `sticky bottom-0`; dưới `lg` thành tab Thực đơn và Đơn |
| Màn hình bếp | Nền trắng, `grid auto-rows-min gap-4 p-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]` |
| Hóa đơn | `grid gap-6 lg:grid-cols-3`: danh sách `lg:col-span-2 min-w-0`, tờ hóa đơn `lg:sticky lg:top-6 self-start` |
| Form | `grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2`, ô dài `md:col-span-2`, nút ở chân hộp thoại `sticky bottom-0` |
| Khung khách | `flex min-h-dvh flex-col`; `header sticky top-0 z-40 bg-white`; `main flex-1`; nội dung `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` |
| Trang chủ | Hero `grid lg:grid-cols-2 min-h-[640px]`: nửa trái `bg-brand-700 text-white`, nửa phải ảnh `object-cover`; thanh đặt bàn `lg:-mt-10 relative z-10` |
| Thực đơn | `grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)_340px]`, hai cột bên `lg:sticky lg:top-20 self-start`; lưới món `grid grid-cols-2 gap-4 xl:grid-cols-3` |
| Đặt bàn | `grid gap-8 lg:grid-cols-3`: các bước `lg:col-span-2 space-y-6`, tóm tắt `lg:sticky lg:top-20 self-start` |
| Tại bàn (điện thoại) | `min-h-dvh pb-28`; dải bàn `sticky top-0`; danh mục cuộn ngang `sticky top-12 flex gap-2 overflow-x-auto`; thanh giỏ `fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]` |

### 5.1 Trang khách

**Trang chủ.** Một việc chính: đặt bàn hoặc gọi món.

```
┌────────────────────────────────────────────────────────────────────┐
│ Logo   Thực đơn  Đặt bàn  Về chúng tôi      [Gọi món tại bàn] (A)  │
├──────────────────────────────┬─────────────────────────────────────┤
│ NỀN CAM 700, CHỮ TRẮNG       │                                     │
│ Nhà hàng món Việt            │        ẢNH MÓN LỚN TRÀN MÉP         │
│ ở Thanh Xuân, Hà Nội         │                                     │
│ 10:00–22:00                  │                                     │
│ ┌──────────────────────────┐ │                                     │
│ │ Ngày │ Giờ ▾ │ Khách ▾ │→│ │                                     │
│ └──────────────────────────┘ │                                     │
├──────────────────────────────┴─────────────────────────────────────┤
│ Món được gọi nhiều   (1 ảnh lớn + 4 ảnh nhỏ, không phải lưới đều)  │
├────────────────────────────────────────────────────────────────────┤
│ Gợi ý cho bạn  (cuộn ngang)      -- chỉ khi đã đăng nhập           │
├─────────────────────────┬──────────────────────────────────────────┤
│ Không gian: Sảnh, Sân   │  Ảnh đổi theo khu vực                    │
│ thượng, Phòng VIP       │                                          │
├─────────────────────────┴──────────────────────────────────────────┤
│ DẢI CAM: địa chỉ cỡ chữ lớn + giờ + Đặt bàn                        │
└────────────────────────────────────────────────────────────────────┘
```

Thanh đặt bàn nằm ngay trong hero, theo cách "một hành động rõ ràng" của Noma.

**Thực đơn.** Như một quyển menu, giá hiện rõ theo Padella.

```
┌─ DANH MỤC ──┬─ MÓN ───────────────────────────────┬─ GIỎ (nếu ở bàn) ─┐
│ Khai vị   5 │ [Tìm]  [Chay] [Không cay] [Hải sản] │ Bàn T02           │
│ Bún phở   6 │ ── Khai vị ──                       │ 2 Phở bò          │
│ Cơm       3 │ ┌───────┐ ┌───────┐ ┌───────┐       │ 1 Trà đá          │
│ Món chính 6 │ │ ảnh   │ │ ảnh   │ │ ảnh   │       │ ────────          │
│ Lẩu       3 │ │ tên   │ │ tên   │ │ tên   │       │ 245.000đ          │
│ Đồ uống   6 │ │ giá + │ │ giá + │ │ giá + │       │ [Gửi bếp]         │
└─────────────┴─────────────────────────────────────┴───────────────────┘
```

Danh mục bám theo khi cuộn, tự đánh dấu mục đang xem. Điện thoại: danh mục thành thanh ngang, giỏ thành thanh dưới.

**Chi tiết món.** Sheet trên điện thoại, cửa sổ hai cột trên máy tính: ảnh lớn, mô tả, tuỳ chọn, số lượng, ghi chú, đánh giá. Nút dính đáy: **Thêm · 150.000đ**.

**Tại bàn (điện thoại).**

```
┌──────────────────────────┐
│ DẢI CAM  Bàn T02 · Tầng 2│
│ 3 người đang gọi cùng    │
├──────────────────────────┤
│ Gợi ý cho bàn   (cuộn)   │
│ [Khai vị][Bún phở][Cơm]… │
│ ┌────┐ Phở bò     75.000 │
│ └────┘ mô tả         (+) │
├──────────────────────────┤
│ Thực đơn │ Đơn bàn │ Gọi NV │ AI │
│ [ Xem giỏ · 3 món · 245k ]│
└──────────────────────────┘
```

Tab **Đơn bàn**: món theo người gọi, thanh tiến độ từng món, tạm tính, **Yêu cầu thanh toán**.

**Màn vào bàn (cách B, C).** Sheet: khung camera chiếm phần lớn, dòng dưới **Nhập mã bàn**.

**Đặt bàn.** Giữ dropdown giờ. Sơ đồ bàn thật dùng chung với nhân viên, chạm chọn bàn. Bước sau là tóm tắt và xác nhận, kèm tuỳ chọn gọi món trước.

**Tài khoản.** Thẻ thành viên cam (hạng, điểm, thanh tiến độ lên hạng) ở trên; dưới là lượt đặt sắp tới, lịch sử có nút **Gọi lại**, sở thích, thiết bị.

**Đăng nhập.** Nửa trái khối cam kèm ảnh món, nửa phải form.

Điện thoại có thanh dưới cố định: Trang chủ, Thực đơn, **Gọi món** (nút cam giữa), Đặt bàn, Tài khoản.

### 5.2 Khung nhân viên

Thanh menu **cam 700, chữ trắng**, mục đang chọn là khối trắng chữ cam. Đây là thay đổi tạo bản sắc lớn nhất. Trên cùng nội dung có thanh mảnh: tên trang, Ctrl+K, chuông, ca hiện tại.

### 5.3 Nhóm vận hành: nhiều khu vực, ít cuộn

**Tổng quan.**

```
┌─ DOANH THU (khối cam) ───┬─ Bàn ─────┬─ Bếp ──────┬─ Đặt bàn ───┐
│ 16.383.276đ   +12%       │ 9/30      │ 25 món     │ 5 lượt      │
│ biểu đồ nhỏ theo giờ     │ thanh     │ chờ lâu: 3 │ tới: 18:30  │
├──────────────────────────┴───────────┼────────────┴─────────────┤
│ Sơ đồ thu nhỏ theo tầng              │ Lượt đặt hôm nay (dòng   │
│ (bấm bàn mở chi tiết)                │ thời gian theo giờ)      │
├──────────────────────────────────────┼──────────────────────────┤
│ Doanh thu 7 ngày                     │ Món bán chạy (có ảnh)    │
│                                      │ Sắp hết nguyên liệu      │
└──────────────────────────────────────┴──────────────────────────┘
```

**Sơ đồ bàn.** Học từ mẫu Elinext và Suhayel Nasim: mặt bằng thật, hình bàn theo số chỗ, ghế vẽ quanh bàn.

```
┌─ Tầng 1 | Tầng 2 | Tầng 3 ── [Trống 8] [Có khách 9] ─┬─ BÀN T02 ─────┐
│  ┌─ Sảnh A ─────────────────────────────────────┐    │ 4 khách · 25' │
│  │  ▪▪        ▪▪        ▪ ▪       ▪ ▪           │    │ PIN 4821      │
│  │ ┌──┐      ┌──┐      ┌────┐    ┌────┐         │    │ Món (tiến độ) │
│  │ │A1│      │A2│      │ A4 │    │ A5 │         │    │ Thành viên    │
│  │ └──┘      └──┘      └────┘    └────┘         │    │ 494.000đ      │
│  └──────────────────────────────────────────────┘    │ [Gọi thêm]    │
│  ┌─ Quầy bar ─┐  ┌─ Sân thượng ─┐                    │ [Thanh toán]  │
└──────────────────────────────────────────────────────┴───────────────┘
```

Vị trí bàn lưu trong dữ liệu (`pos_x`, `pos_y`), sửa bằng số ở trang Tầng và bàn. Kéo thả vẫn ngoài phạm vi như spec.

**Gọi món.** Ba vùng theo mẫu POS của Tasfin Hasan, Tajrin Nahar: danh mục, ảnh món một chạm là thêm, đơn hàng cố định bên phải.

**Phục vụ.** Một hàng đợi gộp món sẵn sàng và yêu cầu khách, chờ lâu nhất lên đầu, thẻ lớn, một nút hành động.

**Màn hình bếp.** Layout riêng, không có menu, full màn hình. Nền trắng như mọi màn khác. Thẻ theo bàn, đổi độ đậm theo thời gian chờ, nút lớn cho tay đeo găng, dòng tổng "đang cần: 5 Phở bò".

**Hóa đơn.** Hai cột: danh sách bên trái, bản xem trước hóa đơn dạng tờ giấy bên phải, thu tiền ngay tại đó.

### 5.4 Nhóm quản lý: bảng có chủ đích

Khuôn chung: dải số tóm tắt, tab, thanh lọc nền cam nhạt, bảng có hàng thoáng, phân trang. Khác nhau ở cột đầu và cách xem:

| Trang | Điểm riêng |
|---|---|
| Thực đơn | Chuyển **Lưới ảnh** và **Bảng**, sửa nhanh ngay trên dòng |
| Đặt bàn (nhân viên) | Nút lọc kèm số đếm: Hôm nay, Sắp đến, Trễ, Đã nhận bàn. Không còn Chờ xác nhận |
| Kho | Thanh mức tồn trong từng dòng, khối "Cần nhập" trên cùng |
| Tầng và bàn | Bên trái cây tầng, bên phải sơ đồ xem trước |
| Nhân viên | Có ảnh đại diện, xem bảng hoặc thẻ |
| Lịch ca | Lịch tuần, ca là khối theo cam đậm nhạt |
| Voucher | Dạng thẻ phiếu giảm giá có răng cưa |
| Khách | Bấm dòng mở hồ sơ bên phải |
| Báo cáo | Khối số lớn, biểu đồ không đóng khung từng ô |
| Vai trò | Giữ bố cục, đổi phong cách |

---

## 6. Skill, plugin dùng ở từng bước

| Bước | Skill, công cụ | Dùng để |
|---|---|---|
| Chốt thiết kế | `superpowers:brainstorming` | Duyệt các quyết định mục 9 |
| Chia việc | `superpowers:writing-plans` | Tách plan này thành task nhỏ |
| Môi trường riêng | Nhánh `redesign/fe` | Không dùng worktree vì toàn bộ code hiện chưa commit, worktree mới sẽ không có code đó |
| Xây giao diện | `agent-skills:frontend-ui-engineering` | Component, khả năng truy cập, responsive |
| Trang khách | `taste-skill` | Quy tắc ảnh dẫn dắt, chữ, khoảng cách. Bộ kit HTML tĩnh của skill không dùng được cho React |
| Biểu đồ | `dataviz` | Chạy `validate_palette` cho dải cam |
| Luồng bàn | `agent-skills:security-and-hardening` | PIN, giới hạn số lần, token phiên |
| Tính tiền, phiên bàn | `superpowers:test-driven-development` | Viết test trước |
| Kiểm tra thật | `playwright-cli`, Chrome DevTools | Chụp 390, 768, 1024, 1440 từng trang |
| Rà cuối | `code-review`, `superpowers:verification-before-completion` | Không báo xong khi chưa có bằng chứng |

---

## 7. Thứ tự làm

**Có cổng duyệt ở giai đoạn 2** để không làm hết rồi mới biết chưa đẹp.

Antd và Tailwind chạy song song tới giai đoạn 6, nên trang chưa chuyển vẫn dùng được. Mỗi giai đoạn kết thúc bằng build, oxlint, vitest.

**GĐ 1. Nền móng**

| # | Việc | Kiểm tra |
|---|---|---|
| 1.1 | Tạo nhánh `redesign/fe`. Code hiện chưa commit nên đi theo sang nhánh mới; chỉ commit khi bạn yêu cầu | Đang ở nhánh mới, không mất file |
| 1.2 | Cài `tailwindcss`, `@tailwindcss/vite`, `radix-ui`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, `vaul`, `motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-table@8`, `@fontsource/be-vietnam-pro`, `cmdk`, `react-day-picker`, `qrcode.react`. `@yudiel/react-qr-scanner` cài ở bước 3.3 | Build chạy |
| 1.3 | Token mục 4.2 vào `@theme`; tách CSS cũ sang `src/legacy.css` theo mục 3.2 | Trang cũ không đổi hình |
| 1.4 | `components/ui` theo mục 3.5 | `/dev/ui` đủ trạng thái thường, rê chuột, focus, tắt, lỗi |
| 1.5 | `components/brand` theo mục 3.5 | Như trên |
| 1.6 | `components/data` theo mục 3.5 | Thử với 200 dòng dữ liệu |
| 1.7 | `hooks.js` đổi `message` antd sang sonner, không `return` trong `onSuccess` | Thao tác không chờ 3 giây |

**GĐ 2. Mẫu 3 màn, cổng duyệt**

| # | Việc | Kiểm tra |
|---|---|---|
| 2.1 | Thêm `posX`, `posY`, `shape` cho bàn, `planW`, `planH` cho khu vực vào dữ liệu mẫu; đổi khóa sang `rm-demo-v10` | Test: bàn không chồng nhau, nằm trong khu vực |
| 2.2 | `SiteLayout` và Trang chủ | Chụp 390, 1440 |
| 2.3 | `StaffLayout` mới và Sơ đồ bàn, ngăn chi tiết bàn | Chụp 768, 1024, 1440 |
| 2.4 | `TableLayout` và Tại bàn trên điện thoại | Chụp 390 |
| 2.5 | **Bạn xem và duyệt.** Chưa đồng ý thì sửa tại đây, chưa làm trang khác | **Bạn đồng ý hướng thiết kế** |

**GĐ 3. Nghiệp vụ, viết test trước**

| # | Việc | Test |
|---|---|---|
| 3.1 | Đặt bàn tự xác nhận (mục 2.11) | Trùng bàn trùng giờ thì lượt sau lỗi; bàn đang có khách; quá số lượt; "Đã đặt" tính đúng theo giờ |
| 3.2 | Gộp vai trò Nhân viên (mục 2.12) | Nhân viên thu tiền được, không hủy được hóa đơn |
| 3.3 | Phiên bàn và bốn cách vào bàn (mục 2.3, 2.4); chặn gọi khi bàn chưa mở | Đủ các dòng bảng 2.4; PIN sai 5 lần bị chặn |
| 3.4 | Gọi món chung: ghi người gọi, tạm tính cả bàn và của tôi (mục 2.5) | Hai thiết bị cùng bàn thấy chung đơn |
| 3.5 | Giỏ nháp và đặt món trước (mục 2.9) | Giỏ giữ khi vào bàn; món chưa vào bếp trước khi Nhận bàn; món hết báo đúng |
| 3.6 | Tuỳ chọn món, hóa đơn cho khách, Yêu cầu thanh toán (mục 2.8, 2.10) | Tuỳ chọn cộng đúng tiền trong `calcBill` |
| 3.7 | Cập nhật spec theo mục 2.7, 2.9 đến 2.12 | Spec khớp code |

**GĐ 4. Trang khách còn lại**

Thực đơn, chi tiết món, Đặt bàn, Tài khoản, Đăng nhập, Trợ lý chat, Nguồn ảnh. Xong khi đi hết luồng: đặt bàn kèm món, đến nơi, gửi bếp, yêu cầu thanh toán, nhận điểm.

**GĐ 5. Nhóm vận hành**

Tổng quan, Gọi món, Phục vụ, Đặt bàn, Hóa đơn, Màn hình bếp (layout riêng, nền trắng). Xong khi một nhân viên phục vụ trọn một bàn mà không phải rời màn hình đang làm quá một lần.

**GĐ 6. Nhóm quản lý, gỡ antd**

Báo cáo, Thực đơn, Kho, Tầng và bàn, Nhân viên và ca, Voucher, Khách và đánh giá, Trợ lý AI, Người dùng, Vai trò, Lịch làm của tôi. Gỡ `antd`, `@ant-design/*`, xóa CSS cũ. Xong khi `grep antd src` không còn kết quả.

**GĐ 7. Rà soát**

Chụp 26 trang ở 390, 768, 1024, 1440; kiểm tra bàn phím, tương phản, lỗi console; đối chiếu mục 8.

---

## 8. Tiêu chí hoàn thành

- Che logo đi vẫn nhận ra thương hiệu nhờ màu và bố cục.
- Không hai nhóm trang nào có cùng bố cục.
- Không còn màu ngoài trắng, cam, nâu đen; đỏ chỉ dùng cho lỗi và xóa; xám ấm `mute` chỉ cho bàn ngừng dùng, ô bị khóa.
- Mọi cặp chữ và nền đạt 4.5:1, chữ lớn 3:1.
- Mỗi trang có đủ trạng thái tải, trống, lỗi, không có quyền.
- Đạt ở 390, 768, 1024, 1440; không cuộn ngang.
- Dùng được bằng bàn phím, có viền focus.
- Từ quét QR đến gửi bếp dưới 4 lần chạm với món không có tuỳ chọn.
- Khách đã đăng nhập thấy đúng bàn mình trong cả bốn cách.
- Đặt bàn xong là xác nhận ngay; hai người đặt cùng bàn cùng giờ thì người sau nhận lỗi rõ ràng.
- Không có món nào vào bếp khi chưa có phiên bàn.

---

## 9. Quyết định

| # | Nội dung | Trạng thái |
|---|---|---|
| 1 | Bỏ antd, dùng Tailwind + component kiểu shadcn | Đã chốt |
| 2 | Hai màu trắng và cam, không dùng nền tối ở bất kỳ màn nào | Đã chốt |
| 3 | Có đặt món trước, món chỉ vào bếp khi đã có phiên bàn | Đã chốt khi bạn yêu cầu làm theo plan |
| 4 | Thanh toán sau khi ăn, không đặt cọc đợt này | Đã chốt khi bạn yêu cầu làm theo plan |
| 5 | Đặt bàn tự xác nhận, bỏ `PENDING` | Đã chốt |
| 6 | Gộp thu ngân và phục vụ thành Nhân viên | Đã chốt khi bạn yêu cầu làm theo plan |

---

## 10. Nguồn và giới hạn

- Toast: [Server-Started Orders](https://support.toasttab.com/en/article/Server-Started-Orders-with-Toast-Mobile-Order-PayTM-INTERNAL), [Group Ordering](https://support.toasttab.com/en/article/Group-Ordering-on-Toast-Mobile-Order-PayTM-INTERNAL), [tổng quan](https://support.toasttab.com/en/article/Mobile-Order-and-Pay-Overview)
- Việt Nam: [Sapo FnB Staff](https://apps.apple.com/vn/app/sapo-fnb-staff/id1481818437), [danh sách phần mềm có iPOS](https://mytour.vn/en/blog/xep-hang/top-9-best-cafe-management-software-providers-mytour.html)
- Chống gọi từ xa: [Foodship PIN](https://foodship.getoutline.com/s/point-of-sale-knowledge-base/doc/how-to-generate-pin-for-qr-code-order-yI58fdpYbB), [Abacus PIN](https://help.abacus.co/en/articles/9413989-how-to-set-a-pin-on-the-table-ordering-app), [CloudWaitress](https://support.cloudwaitress.com/how-to-guides/configure-dine-in-qr-table-numbers)
- Website nhà hàng: [Magier 2026](https://www.magier.com/blog/best-restaurant-website-design-examples), [Dishoom](https://www.dishoom.com/)
- Mẫu POS và app: [Dribbble restaurant POS](https://dribbble.com/search/restaurant-pos), [Dribbble food ordering orange](https://dribbble.com/search/food-ordering-mobile-app-orange), [VP0 POS](https://vp0.com/blogs/restaurant-pos-tablet-ui-template-ios)
- Công nghệ: [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [so sánh shadcn và antd](https://shadcnstudio.com/blog/ant-design-vs-shadcn/)
- Màu: [Deliveroo về màu dễ đọc](https://medium.com/deliveroo-design/brightening-up-accessibility-with-a-new-colour-system-5921915641ed), [quy tắc 60-30-10](https://uxplanet.org/the-60-30-10-rule-a-foolproof-way-to-choose-colors-for-your-ui-design-d15625e56d25)

- Repo tham khảo: [Supply_Chain_FrontEnd](https://github.com/trungduck45/Supply_Chain_FrontEnd), commit `91c6ad7`, chỉ đọc mã nguồn
- Trả sau và đặt món trước: [Otter Open Tabs](https://helpdesk.tryotter.com/hc/en-us/articles/11716604717331-Open-Tabs), [Fleksa](https://fleksa.com/en/qr-ordering), [Sunday prepayment](https://sundayapp.com/?p=108515), [Stampede](https://stampede.ai/docs/table-bookings/deposits-and-pre-orders). Chủ yếu là tài liệu của hãng bán phần mềm

**Chưa kiểm chứng được:** giao diện chạy thật của repo tham khảo (cần backend); cách Sunday và me&u gắn tài khoản với bàn (không tìm thấy tài liệu); cách các phần mềm Việt Nam tích điểm khi quét QR; tài liệu an ninh PIN của dự án satisfecho (trang lỗi 404, chỉ đọc được phần tóm tắt trên kết quả tìm kiếm). Mẫu Dribbble chỉ xem ở ảnh thu nhỏ. Ý "khách đã đăng nhập vào phiên tự động khi nhận bàn" (cách D) là thiết kế của mình suy ra, không lấy từ nguồn nào.
