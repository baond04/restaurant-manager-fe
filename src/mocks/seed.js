// Dữ liệu giả cho bản demo giao diện. Khi có backend, bỏ thư mục mock và trỏ api.js sang REST.
import dayjs from 'dayjs'
import '@/utils/format' // nạp locale vi trước khi tính tuần (tuần bắt đầu thứ Hai)
import { ALL_PERMISSIONS } from '@/constants/permissions'
import { calcBill } from '@/utils/billing'
import { shapeFor } from '@/utils/floor'

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildSeed() {
  const r = rng(20261108)
  const pick = (a) => a[Math.floor(r() * a.length)]
  const int = (a, b) => a + Math.floor(r() * (b - a + 1))
  const now = dayjs()
  const today = now.startOf('day')
  let seq = 1000
  const id = () => ++seq

  // Bốn vai trò có tài khoản; khách vãng lai không có vai trò (token tại bàn). Bếp và phục vụ không dùng hệ thống:
  // nhân viên nói miệng với bếp, phục vụ tự mang món ra, nên họ chỉ có hồ sơ nhân sự (roleId = null).
  const STAFF_PERMS = ['table:view', 'table:operate', 'reservation:view', 'reservation:manage', 'order:view', 'order:create', 'order:cancel_item',
    'request:handle', 'bill:view', 'bill:pay', 'bill:discount', 'menu:view', 'schedule:view_own']
  const roles = [
    { id: 1, code: 'CUSTOMER', name: 'Khách hàng', description: 'Quyền phía khách cố định, không sửa ở đây.', isSystem: true, fixed: true, permissions: [] },
    { id: 2, code: 'STAFF', name: 'Nhân viên', description: 'Sơ đồ bàn, gọi món hộ khách, đặt bàn, yêu cầu của khách, thu tiền.', isSystem: true, permissions: STAFF_PERMS },
    { id: 3, code: 'MANAGER', name: 'Quản lý', description: 'Mọi chức năng trừ người dùng và phân quyền.', isSystem: true, permissions: ALL_PERMISSIONS.filter((p) => p !== 'user:manage' && p !== 'role:manage') },
    { id: 4, code: 'ADMIN', name: 'Quản trị', description: 'Toàn quyền, không sửa được.', isSystem: true, locked: true, permissions: ALL_PERMISSIONS },
  ]
  const roleId = Object.fromEntries(roles.map((x) => [x.code, x.id]))

  // --- Nhân viên (vai trò null: không có tài khoản đăng nhập)
  const staffDefs = [
    ['Admin Hệ Thống', 'ADMIN', 'Quản trị'], ['Lê Minh Quân', 'MANAGER', 'Quản lý'], ['Trần Thu Hà', 'MANAGER', 'Quản lý ca'],
    ['Đỗ Khánh Linh', 'STAFF', 'Thu ngân'], ['Ngô Bảo Châu', 'STAFF', 'Thu ngân'],
    ['Phạm Thảo', 'STAFF', 'Nhân viên'], ['Nguyễn Văn Nam', 'STAFF', 'Nhân viên'], ['Bùi Hải Yến', null, 'Phục vụ'],
    ['Hoàng Đức Anh', null, 'Phục vụ'], ['Mai Phương', null, 'Phục vụ'], ['Vũ Quốc Hùng', null, 'Bếp trưởng'],
    ['Đặng Tiến', null, 'Bếp chính'], ['Lý Thanh Tâm', null, 'Phụ bếp'], ['Cao Thị Mơ', null, 'Phục vụ'],
  ]
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().split(' ')
  const users = staffDefs.map(([fullName, role, position], i) => {
    const p = slug(fullName)
    return {
      id: i + 1, kind: 'STAFF', roleId: role ? roleId[role] : null, fullName, position,
      email: `${p.at(-1)}.${p[0]}${i}@nhahang.vn`, phone: `09${String(10000000 + i * 734521).slice(0, 8)}`,
      status: i === 13 ? 'LOCKED' : 'ACTIVE', workStatus: i === 13 ? 'QUIT' : i === 9 ? 'ON_LEAVE' : 'WORKING',
      hireDate: today.subtract(int(60, 900), 'day').format('YYYY-MM-DD'), createdAt: today.subtract(int(60, 900), 'day').toISOString(),
      lastLoginAt: now.subtract(int(1, 3000), 'minute').toISOString(),
    }
  })
  const custNames = ['Nguyễn Minh Anh', 'Trần Quốc Bảo', 'Lê Thu Trang', 'Phạm Gia Huy', 'Võ Ngọc Hân', 'Đinh Công Mạnh', 'Hồ Thị Lan', 'Phan Đức Long', 'Tạ Hồng Nhung', 'Kiều Văn Sơn', 'Lâm Mỹ Duyên', 'Quách Tuấn', 'Dương Khánh Vy', 'Châu Minh Khoa', 'Từ Bích Ngọc', 'Lục Hải Đăng', 'Tôn Nữ Uyên', 'Mạc Thành Đạt']
  custNames.forEach((fullName, i) => {
    const p = slug(fullName)
    users.push({
      id: 100 + i, kind: 'CUSTOMER', roleId: 1, fullName, email: `${p.at(-1)}${p[0]}${i}@gmail.com`, phone: `03${String(20000000 + i * 911237).slice(0, 8)}`,
      status: i === 11 ? 'LOCKED' : 'ACTIVE', points: int(0, 900), gender: i % 3 === 0 ? 'MALE' : 'FEMALE',
      createdAt: today.subtract(int(1, 400), 'day').toISOString(), lastLoginAt: now.subtract(int(10, 20000), 'minute').toISOString(),
      likeTagIds: [], allergyTagIds: i === 0 ? [7] : [],
    })
  })
  const customers = users.filter((u) => u.kind === 'CUSTOMER')

  // --- Thực đơn
  const categories = ['Khai vị', 'Bún, phở, mì', 'Cơm', 'Món chính', 'Rau', 'Lẩu', 'Đồ uống', 'Tráng miệng']
    .map((name, i) => ({ id: i + 1, name, sortOrder: i + 1, isActive: true }))
  const tags = [
    ['Cay', 'TASTE'], ['Ít cay', 'TASTE'], ['Chay', 'DIET'], ['Hải sản', 'INGREDIENT'], ['Bò', 'INGREDIENT'], ['Heo', 'INGREDIENT'],
    ['Đậu phộng', 'INGREDIENT'], ['Gà', 'INGREDIENT'], ['Món nước', 'CUISINE'], ['Miền Bắc', 'CUISINE'], ['Miền Trung', 'CUISINE'], ['Miền Nam', 'CUISINE'], ['Tiệc', 'OCCASION'],
  ].map(([name, type], i) => ({ id: i + 1, name, type }))
  const itemDefs = [
    // [tên, danh mục, giá, ảnh, tag ids, phút]
    ['Gỏi cuốn tôm thịt', 1, 55000, 'goicuon', [4, 6, 7, 12], 8], ['Chả giò', 1, 65000, 'chagio', [6, 12], 10], ['Bánh xèo', 1, 85000, 'banhxeo', [4, 6, 12], 15],
    ['Gà chiên giòn', 1, 60000, 'gachien', [8], 10], ['Gỏi ngó sen', 1, 75000, 'goingosen', [4, 7], 10],
    ['Phở bò tái', 2, 75000, 'pho', [5, 9, 10], 8], ['Bún chả Hà Nội', 2, 70000, 'buncha', [6, 10], 12], ['Bún bò Huế', 2, 75000, 'bunbohue', [1, 5, 6, 9, 11], 10],
    ['Mì Quảng', 2, 70000, 'miquang', [4, 6, 7, 11], 10], ['Phở gà', 2, 70000, 'phoga', [8, 9, 10], 8], ['Bún riêu cua', 2, 65000, 'bunrieu', [4, 9, 10], 10],
    ['Cơm tấm sườn bì', 3, 70000, 'comtam', [6, 12], 10], ['Cơm chiên hải sản', 3, 85000, 'comchien', [4], 12], ['Cơm gà Hội An', 3, 75000, 'comga', [8, 11], 10],
    ['Bò lúc lắc', 4, 165000, 'boluclac', [5, 12, 13], 15], ['Cá kho tộ', 4, 135000, 'cakho', [12], 20], ['Gà nướng mật ong', 4, 185000, 'ganuong', [8, 13], 25],
    ['Tôm rang muối', 4, 195000, 'tomrang', [1, 4, 13], 15], ['Sườn nướng', 4, 155000, 'suonnuong', [6, 13], 20], ['Đậu hũ sốt cà', 4, 65000, 'dausotca', [3], 10],
    ['Rau muống xào tỏi', 5, 55000, 'raumuong', [3], 6], ['Cải thìa xào nấm', 5, 60000, 'caixao', [3], 8], ['Rau củ chấm mắm', 5, 50000, 'rauluoc', [3], 8],
    ['Lẩu thái hải sản', 6, 389000, 'lauthai', [1, 4, 9, 13], 20], ['Lẩu bò nhúng giấm', 6, 359000, 'laubo', [5, 9, 13], 20], ['Lẩu nấm chay', 6, 289000, 'launam', [3, 9], 20],
    ['Cà phê sữa đá', 7, 35000, 'caphe', [], 3], ['Trà đá', 7, 10000, 'tra', [], 1], ['Nước mía', 7, 25000, 'nuocmia', [], 3],
    ['Trà chanh', 7, 25000, 'trachanh', [], 3], ['Sinh tố bơ', 7, 45000, 'sinhto', [], 5], ['Bia Hà Nội', 7, 25000, 'bia', [], 1],
    ['Chè ba màu', 8, 35000, 'che', [3], 3], ['Bánh flan', 8, 25000, 'flan', [], 2], ['Kem dừa', 8, 45000, 'kemdua', [], 3], ['Sữa chua nếp cẩm', 8, 30000, 'suachua', [3], 2],
  ]
  const descs = {
    'Gỏi cuốn tôm thịt': 'Tôm, thịt luộc, bún, rau thơm, chấm tương đậu', 'Chả giò': 'Nhân thịt heo, mộc nhĩ, chiên giòn', 'Bánh xèo': 'Vỏ giòn, nhân tôm thịt giá đỗ, cuốn rau', 'Gà chiên giòn': 'Ức gà tẩm bột, sốt ớt ngọt',
    'Gỏi ngó sen': 'Ngó sen, tôm, đậu phộng rang', 'Phở bò tái': 'Bò tái, nước dùng ninh xương 12 tiếng', 'Bún chả Hà Nội': 'Chả nướng than, nước mắm chua ngọt', 'Bún bò Huế': 'Bắp bò, giò heo, sả, cay nhẹ',
    'Mì Quảng': 'Sợi mì vàng, tôm, thịt, bánh tráng mè', 'Phở gà': 'Gà ta xé, lá chanh', 'Bún riêu cua': 'Riêu cua đồng, cà chua, đậu rán', 'Cơm tấm sườn bì': 'Sườn nướng, bì, chả trứng',
    'Cơm chiên hải sản': 'Tôm, mực, trứng, đậu Hà Lan', 'Cơm gà Hội An': 'Cơm nấu nước gà, gà chiên', 'Bò lúc lắc': 'Thăn bò áp chảo, salad', 'Cá kho tộ': 'Cá basa kho nồi đất, tiêu xanh',
    'Gà nướng mật ong': 'Nửa con, nướng than', 'Tôm rang muối': 'Tôm sú, muối ớt', 'Sườn nướng': 'Sườn heo non, sốt BBQ', 'Đậu hũ sốt cà': 'Đậu rán, cà chua, hành lá',
    'Rau muống xào tỏi': 'Rau trong ngày, tỏi phi', 'Cải thìa xào nấm': 'Cải thìa, nấm hương', 'Rau củ chấm mắm': 'Rau củ tươi, mắm nêm', 'Lẩu thái hải sản': 'Phần 3–4 người, tôm, mực, nghêu',
    'Lẩu bò nhúng giấm': 'Phần 3–4 người, bắp bò, rau cuốn', 'Lẩu nấm chay': 'Phần 3–4 người, 6 loại nấm', 'Cà phê sữa đá': 'Cà phê phin, sữa đặc', 'Trà đá': 'Ly lớn',
    'Nước mía': 'Ép tại quầy, tắc', 'Trà chanh': 'Trà đen, chanh tươi', 'Sinh tố bơ': 'Bơ sáp, sữa đặc', 'Bia Hà Nội': 'Chai 450ml',
    'Chè ba màu': 'Đậu đỏ, đậu xanh, thạch, nước cốt dừa', 'Bánh flan': 'Caramel, cà phê', 'Kem dừa': 'Kem dừa, cơm dừa non', 'Sữa chua nếp cẩm': 'Sữa chua nhà làm, nếp cẩm',
  }
  const items = itemDefs.map(([name, categoryId, price, img, tagIds, prepMinutes], i) => ({
    id: i + 1, name, categoryId, price, image: img ? `/img/${img}.jpg` : null, tagIds, prepMinutes,
    description: descs[name], isAvailable: i !== 16, spicyLevel: tagIds.includes(1) ? 2 : 0, recipe: [],
  }))

  const ingredients = [
    ['Thịt bò', 'kg', 18, 5, 280000], ['Thịt heo', 'kg', 22, 6, 140000], ['Tôm', 'kg', 4, 5, 320000], ['Gà', 'kg', 15, 5, 110000],
    ['Bánh phở', 'kg', 30, 10, 25000], ['Bún tươi', 'kg', 8, 10, 20000], ['Gạo tấm', 'kg', 45, 20, 22000], ['Rau muống', 'kg', 12, 5, 18000],
    ['Rau sống', 'kg', 9, 4, 30000], ['Đậu phộng', 'kg', 3, 2, 60000], ['Nấm', 'kg', 2, 3, 90000], ['Đậu hũ', 'miếng', 40, 20, 4000],
    ['Nước mắm', 'lít', 14, 5, 55000], ['Cà phê', 'kg', 3.5, 2, 260000], ['Sữa đặc', 'hộp', 20, 10, 24000], ['Bia Hà Nội', 'chai', 96, 48, 14000],
    ['Mía', 'kg', 25, 10, 9000], ['Bơ', 'kg', 1.5, 2, 70000], ['Dừa', 'quả', 18, 10, 15000], ['Cua đồng', 'kg', 6, 3, 120000],
  ].map(([name, unit, stock, minStock, cost], i) => ({ id: i + 1, name, unit, stock, minStock, cost }))
  const rec = { 1: [[3, 0.03], [2, 0.03], [9, 0.05]], 6: [[1, 0.12], [5, 0.2]], 7: [[2, 0.15], [6, 0.15], [9, 0.05]], 8: [[1, 0.1], [6, 0.2]], 12: [[2, 0.18], [7, 0.2]], 15: [[1, 0.25]], 21: [[8, 0.3]], 27: [[14, 0.02], [15, 0.1]], 29: [[17, 0.4]], 32: [[16, 1]] }
  Object.entries(rec).forEach(([iid, rs]) => { items[iid - 1].recipe = rs.map(([ingredientId, qty]) => ({ ingredientId, qty })) })

  // --- Tầng, khu vực, bàn (spec 7.4)
  const floors = [{ id: 1, name: 'Tầng 1', level: 1, isActive: true }, { id: 2, name: 'Tầng 2', level: 2, isActive: true }, { id: 3, name: 'Tầng 3', level: 3, isActive: true }]
  const areas = [
    { id: 1, floorId: 1, name: 'Sảnh A', type: 'HALL', serviceFeePercent: 0, minSpend: 0, isActive: true, planW: 620, planH: 430 },
    { id: 2, floorId: 1, name: 'Quầy bar', type: 'BAR', serviceFeePercent: 0, minSpend: 0, isActive: true, planW: 170, planH: 430 },
    { id: 3, floorId: 2, name: 'Sảnh B', type: 'HALL', serviceFeePercent: 0, minSpend: 0, isActive: true, planW: 806, planH: 300 },
    { id: 4, floorId: 2, name: 'Sân thượng', type: 'OUTDOOR', serviceFeePercent: 0, minSpend: 0, isActive: true, planW: 806, planH: 164 },
    { id: 5, floorId: 3, name: 'Phòng VIP 1', type: 'VIP_ROOM', serviceFeePercent: 10, minSpend: 3000000, isActive: true, planW: 300, planH: 200 },
    { id: 6, floorId: 3, name: 'Phòng VIP 2', type: 'VIP_ROOM', serviceFeePercent: 10, minSpend: 4000000, isActive: true, planW: 490, planH: 200 },
    { id: 7, floorId: 3, name: 'Phòng VIP 3', type: 'VIP_ROOM', serviceFeePercent: 10, minSpend: 5000000, isActive: true, planW: 806, planH: 200 },
  ]
  const tables = []
  // Mỗi bàn: [số chỗ, x, y] tính từ góc trên trái của khu vực.
  const addTables = (areaId, prefix, defs) => defs.forEach(([seats, posX, posY], i) => tables.push({
    id: tables.length + 1, areaId, code: `${prefix}${String(i + 1).padStart(2, '0')}`, seats, status: 'AVAILABLE', isActive: true,
    qrToken: Math.floor(r() * 1e16).toString(36).padStart(10, '0'), shape: shapeFor(seats), posX, posY,
  }))
  addTables(1, 'A', [[2, 24, 44], [2, 140, 44], [2, 256, 44], [4, 24, 176], [4, 150, 176], [4, 276, 176], [4, 24, 304], [4, 150, 304], [6, 448, 60], [6, 448, 220]])
  addTables(2, 'BR', [[2, 16, 38], [2, 16, 136], [2, 16, 234], [2, 16, 332]])
  addTables(3, 'B', [[4, 24, 44], [4, 150, 44], [4, 276, 44], [6, 410, 44], [6, 582, 44], [8, 24, 176], [8, 224, 176], [10, 430, 176]])
  addTables(4, 'T', [[2, 24, 48], [4, 144, 44], [4, 272, 44], [4, 400, 44], [4, 528, 44], [6, 650, 44]])
  addTables(5, 'V1-', [[12, 34, 62]]); addTables(6, 'V2-', [[16, 95, 62]]); addTables(7, 'V3-', [[20, 223, 62]])
  tables.find((t) => t.code === 'B08').isActive = false
  tables.find((t) => t.code === 'B08').status = 'DISABLED'
  const areaOf = (t) => areas.find((a) => a.id === t.areaId)

  // --- Voucher
  const vouchers = [
    { code: 'CAM10', name: 'Giảm 10% tối đa 50k', type: 'PERCENT', value: 10, maxDiscount: 50000, minOrderAmount: 200000, s: -20, e: 25, usageLimit: 500, usedCount: 134 },
    { code: 'SINHNHAT', name: 'Sinh nhật giảm 100k', type: 'FIXED', value: 100000, maxDiscount: 0, minOrderAmount: 500000, s: -60, e: 120, usageLimit: 200, usedCount: 41 },
    { code: 'TRUA20', name: 'Giờ trưa giảm 20%', type: 'PERCENT', value: 20, maxDiscount: 80000, minOrderAmount: 300000, s: -10, e: 20, usageLimit: 300, usedCount: 77 },
    { code: 'KHAITRUONG', name: 'Khai trương giảm 30%', type: 'PERCENT', value: 30, maxDiscount: 150000, minOrderAmount: 0, s: -200, e: -150, usageLimit: 1000, usedCount: 1000 },
    { code: 'VIP500', name: 'Phòng VIP giảm 500k', type: 'FIXED', value: 500000, maxDiscount: 0, minOrderAmount: 5000000, s: 5, e: 60, usageLimit: 50, usedCount: 0 },
  ].map((v, i) => ({ id: i + 1, ...v, startAt: today.add(v.s, 'day').toISOString(), endAt: today.add(v.e, 'day').endOf('day').toISOString(), isActive: i !== 3, s: undefined, e: undefined }))

  // --- Ca và lịch
  const shifts = [{ id: 1, name: 'Ca sáng', start: '06:00', end: '14:00' }, { id: 2, name: 'Ca chiều', start: '14:00', end: '22:00' }, { id: 3, name: 'Ca tối', start: '17:00', end: '23:00' }]
  const schedules = []
  const weekStart = today.startOf('week')
  users.filter((u) => u.kind === 'STAFF' && u.workStatus === 'WORKING' && u.roleId !== roleId.ADMIN).forEach((u, k) => {
    for (let d = -7; d < 14; d++) {
      if ((d + k) % 7 === 0) continue // nghỉ 1 ngày/tuần
      const date = weekStart.add(d, 'day')
      const areaId = u.roleId === roleId.STAFF || u.position === 'Phục vụ' ? [1, 3, 4, 5][k % 4] : null
      schedules.push({ id: id(), employeeId: u.id, shiftId: k % 2 ? 2 : 1, areaId, date: date.format('YYYY-MM-DD'), status: date.isBefore(today) ? (r() < 0.05 ? 'ABSENT' : 'PRESENT') : 'SCHEDULED' })
    }
  })

  // --- Lịch sử đơn và hóa đơn 60 ngày
  const orders = [], orderItems = [], bills = []
  const cashiers = users.filter((u) => u.position === 'Thu ngân').map((u) => u.id)
  const waiters = users.filter((u) => u.roleId === roleId.STAFF).map((u) => u.id)
  const activeTables = tables.filter((t) => t.isActive)
  for (let d = 60; d >= 0; d--) {
    const day = today.subtract(d, 'day')
    const n = int(10, 22) + (day.day() >= 5 || day.day() === 0 ? 8 : 0)
    for (let k = 0; k < n; k++) {
      const t = r() < 0.06 ? pick(tables.filter((x) => x.areaId >= 5)) : pick(activeTables.filter((x) => x.areaId < 5))
      const area = areaOf(t)
      const openedAt = day.hour(pick([11, 11, 12, 12, 13, 18, 18, 19, 19, 20, 20])).minute(int(0, 59))
      if (openedAt.add(120, 'minute').isAfter(now)) continue // hôm nay: chỉ lấy đơn đã xong
      const o = { id: id(), tableId: t.id, customerId: r() < 0.55 ? pick(customers).id : null, openedBy: pick(waiters), type: r() < 0.08 ? 'TAKEAWAY' : 'DINE_IN', guestCount: Math.min(t.seats, int(1, t.seats)), status: 'COMPLETED', openedAt: openedAt.toISOString(), closedAt: (openedAt.add(int(35, 110), 'minute').isAfter(day.hour(22)) ? day.hour(21).minute(int(40, 59)) : openedAt.add(int(35, 110), 'minute')).toISOString() }
      orders.push(o)
      const lines = []
      const nItems = area.type === 'VIP_ROOM' ? int(6, 12) : int(2, 6)
      for (let j = 0; j < nItems; j++) {
        const it = pick(items)
        const line = { id: id(), orderId: o.id, itemId: it.id, qty: int(1, area.type === 'VIP_ROOM' ? 4 : 2), unitPrice: it.price, note: '', status: r() < 0.03 ? 'CANCELLED' : 'ORDERED', source: r() < 0.18 ? 'CHATBOT' : r() < 0.4 ? 'STAFF' : 'MENU', createdAt: o.openedAt }
        lines.push(line); orderItems.push(line)
      }
      const voucher = r() < 0.15 ? vouchers[pick([0, 1, 2])] : null
      const b = calcBill({ lines, area, voucher, now: openedAt.toDate() })
      bills.push({ id: id(), orderId: o.id, voucherId: b.discount ? voucher.id : null, ...b, pointsUsed: 0, method: pick(['CASH', 'CASH', 'BANK_TRANSFER', 'CARD']), status: r() < 0.02 ? 'VOID' : 'PAID', cashierId: pick(cashiers), paidAt: o.closedAt })
    }
  }

  // --- Đơn đang mở hôm nay
  const live = [['A04', 3, 52], ['A05', 4, 25], ['A09', 5, 8], ['B02', 4, 40], ['B06', 7, 15], ['T02', 4, 18], ['T03', 2, 65], ['V1-01', 11, 30], ['BR01', 2, 12]]
  const serviceRequests = []
  live.forEach(([code, guests, mins], k) => {
    const t = tables.find((x) => x.code === code)
    t.status = 'OCCUPIED'
    const openedAt = now.subtract(mins, 'minute')
    const o = { id: id(), tableId: t.id, customerId: k === 5 ? 100 : null, openedBy: pick(waiters), type: 'DINE_IN', guestCount: guests, status: 'OPEN', openedAt: openedAt.toISOString(), closedAt: null }
    orders.push(o)
    const n = t.areaId === 5 ? 8 : int(2, 5)
    for (let j = 0; j < n; j++) {
      const it = pick(items)
      const age = Math.max(1, mins - j * 4)
      orderItems.push({ id: id(), orderId: o.id, itemId: it.id, qty: int(1, 2), unitPrice: it.price, note: j === 1 ? 'Ít hành' : '', status: 'ORDERED', source: j === 0 && k % 3 === 0 ? 'CHATBOT' : 'MENU', createdAt: now.subtract(age, 'minute').toISOString() })
    }
    if (k === 1) serviceRequests.push({ id: id(), tableId: t.id, orderId: o.id, type: 'EXTRA_WATER', status: 'OPEN', handledBy: null, createdAt: now.subtract(2, 'minute').toISOString() })
    if (k === 6) serviceRequests.push({ id: id(), tableId: t.id, orderId: o.id, type: 'REQUEST_BILL', status: 'ACKNOWLEDGED', handledBy: 6, createdAt: now.subtract(5, 'minute').toISOString(), ackAt: now.subtract(4, 'minute').toISOString() })
    if (k === 3) serviceRequests.push({ id: id(), tableId: t.id, orderId: o.id, type: 'CALL_STAFF', status: 'OPEN', handledBy: null, createdAt: now.subtract(1, 'minute').toISOString() })
  })
  tables.find((t) => t.code === 'A07').status = 'CLEANING'

  // --- Đặt bàn
  const reservations = []
  const statusFor = (dt) => (dt.isBefore(now) ? pick(['COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']) : 'CONFIRMED')
  for (let k = 0; k < 40; k++) {
    const dt = today.add(int(-14, 10), 'day').hour(pick([11, 12, 18, 18, 19, 19, 20])).minute(pick([0, 30]))
    const c = r() < 0.7 ? pick(customers) : null
    const guestCount = pick([2, 2, 4, 4, 4, 6, 8, 12])
    // Không xếp trùng bàn trong khoảng 2 giờ.
    const fit = activeTables.filter((t) => t.seats >= guestCount && !reservations.some((x) => x.tableIds.includes(t.id) && Math.abs(dayjs(x.time).diff(dt, 'minute')) < 120)).sort((a, b) => a.seats - b.seats)[int(0, 2)]
    reservations.push({ id: id(), customerId: c?.id ?? null, guestName: c?.fullName ?? pick(['Anh Tuấn', 'Chị Hoa', 'Anh Phong', 'Chị Mai']), guestPhone: c?.phone ?? `09${int(10000000, 99999999)}`, time: dt.toISOString(), guestCount, areaId: fit?.areaId ?? null, tableIds: fit ? [fit.id] : [], note: pick(['', '', 'Sinh nhật, cần bánh', 'Có trẻ em', 'Gần cửa sổ']), status: statusFor(dt), createdAt: dt.subtract(int(1, 5), 'day').toISOString() })
  }
  // vài lượt hôm nay để demo
  ;[['A10', 2, '19:00', 'CONFIRMED'], ['B04', 6, '19:30', 'CONFIRMED'], ['V2-01', 14, '19:00', 'CONFIRMED']].forEach(([code, g, hm, status]) => {
    const t = tables.find((x) => x.code === code)
    const [h, m] = hm.split(':')
    reservations.push({ id: id(), customerId: 101, guestName: 'Trần Quốc Bảo', guestPhone: '0320911237', time: today.hour(+h).minute(+m).toISOString(), guestCount: g, areaId: t.areaId, tableIds: [t.id], note: '', status, createdAt: now.subtract(1, 'day').toISOString() })
    if (status === 'CONFIRMED') t.status = 'RESERVED'
  })
  reservations.push({ id: id(), customerId: 100, guestName: 'Nguyễn Minh Anh', guestPhone: users.find((u) => u.id === 100).phone, time: today.add(2, 'day').hour(18).minute(30).toISOString(), guestCount: 4, areaId: 4, tableIds: [tables.find((t) => t.code === 'T02').id], note: 'Gần lan can', status: 'CONFIRMED', createdAt: now.subtract(3, 'hour').toISOString() })

  // --- Phiếu kho
  const inventoryTx = []
  for (let k = 0; k < 40; k++) {
    const ing = pick(ingredients)
    const type = pick(['IMPORT', 'IMPORT', 'EXPORT', 'ADJUST'])
    inventoryTx.push({ id: id(), ingredientId: ing.id, type, qty: type === 'ADJUST' ? -+(r() * 1.5).toFixed(1) : int(2, 20), unitCost: ing.cost, note: { IMPORT: 'Nhập từ nhà cung cấp', EXPORT: 'Xuất dùng trong ngày', ADJUST: 'Kiểm kê cuối ngày' }[type], employeeId: pick([2, 3, 11]), createdAt: today.subtract(int(0, 30), 'day').hour(int(7, 21)).toISOString() })
  }

  // --- Đánh giá và hội thoại AI
  const reviewTexts = ['Rất ngon, sẽ quay lại', 'Nước dùng đậm đà', 'Hơi mặn', 'Phục vụ nhanh', 'Giá hơi cao', 'Món ra nguội', 'Tuyệt vời', 'Bình thường', 'Quảng cáo link lạ: xxx.com']
  const reviews = Array.from({ length: 36 }, (_, k) => ({ id: id(), customerId: pick(customers).id, itemId: pick(items).id, rating: k === 8 ? 1 : pick([5, 5, 4, 4, 3, 2]), comment: k === 8 ? reviewTexts[8] : pick(reviewTexts.slice(0, 8)), hidden: false, createdAt: today.subtract(int(0, 40), 'day').toISOString() }))
  const questions = ['Gợi ý món cho 4 người, không ăn cay', 'Món nào hợp trẻ em?', 'Có món chay không?', 'Món bán chạy nhất?', 'Tôi dị ứng đậu phộng, nên ăn gì?', 'Lẩu nào cho 3 người?', 'Đồ uống không đường?']
  const chatSessions = Array.from({ length: 60 }, (_, k) => {
    const turns = int(1, 6)
    return { id: `s-${k}`, customerId: r() < 0.6 ? pick(customers).id : null, title: pick(questions), turns, feedback: pick([1, 1, 1, -1, 0]), addedToCart: r() < 0.35, latencyMs: int(900, 4200), createdAt: now.subtract(int(10, 60 * 24 * 30), 'minute').toISOString() }
  })

  return {
    roles, users, categories, tags, items, ingredients, inventoryTx, floors, areas, tables, vouchers, shifts, schedules,
    orders, orderItems, bills, serviceRequests, reservations, reviews, chatSessions, seq,
  }
}
