// KHÔNG còn dùng trong ứng dụng (đã nối BE thật qua services/api.js). Giữ để tham khảo luồng nghiệp vụ khi chạy không có BE.
// Lớp API giả: cùng hình dạng với REST thật (spec mục 8) nhưng đọc ghi dữ liệu trong localStorage.
// shortcut: lọc, phân trang làm ở client; khi nối backend thì chuyển thành query params ?page=&size=&from=&to=.
import dayjs from 'dayjs'
import { buildSeed } from '@/mocks/seed'
import { calcBill } from '@/utils/billing'

const KEY = 'rm-demo-v10'
let db = load()

function load() {
  try {
    // Bản dữ liệu cũ sau khi đổi KEY chiếm hết quota localStorage (~5MB), khiến save() thất bại.
    Object.keys(localStorage).filter((k) => k.startsWith('rm-demo-') && k !== KEY).forEach((k) => localStorage.removeItem(k))
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* hỏng hoặc bị chặn: dùng dữ liệu mẫu */ }
  return buildSeed()
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* đầy hoặc bị chặn: vẫn chạy trong bộ nhớ */ }
}
export function reloadFromStorage() { db = load() }
export function resetDemo() { db = buildSeed(); save() }
export const STORAGE_KEY = KEY

const wait = (v) => new Promise((ok) => setTimeout(() => ok(structuredClone(v)), 80))
const fail = (msg) => { throw new Error(msg) }
const nextId = () => ++db.seq
const find = (col, id) => db[col].find((x) => x.id === id) || fail('Không tìm thấy dữ liệu')
const nowIso = () => new Date().toISOString()

export const api = {
  list: (col) => wait(col === 'items' ? db.items.filter((x) => !x.deletedAt) : db[col]),
  get: (col, id) => wait(find(col, id)),
  aiModel: () => wait(db.aiModel),

  async create(col, data) {
    checkUnique(col, data)
    const row = { ...data, id: nextId(), createdAt: nowIso() }
    db[col].push(row)
    if (col === 'inventoryTx') applyStock(row)
    save()
    return wait(row)
  },
  async update(col, id, patch) {
    checkUnique(col, { ...patch, id })
    if (col === 'roles' && find('roles', id).locked) fail('Vai trò Quản trị không sửa được')
    Object.assign(find(col, id), patch)
    save()
    return wait(find(col, id))
  },
  async remove(col, id) {
    const guard = REMOVE_GUARDS[col]?.(id)
    if (guard) fail(guard)
    if (col === 'items') find('items', id).deletedAt = nowIso() // xóa mềm, hóa đơn cũ vẫn tham chiếu được
    else db[col] = db[col].filter((x) => x.id !== id)
    if (col === 'tags') db.items.forEach((i) => { i.tagIds = i.tagIds.filter((t) => t !== id) })
    save()
    return wait(true)
  },

  // --- Bàn và đơn
  async openTable(tableId, { guestCount, openedBy, reservationId = null, customerId = null }) {
    const t = find('tables', tableId)
    if (t.status === 'OCCUPIED') fail(`Bàn ${t.code} đang có khách`)
    if (!t.isActive) fail(`Bàn ${t.code} đang ngừng dùng`)
    const o = { id: nextId(), tableId, reservationId, customerId, openedBy, type: 'DINE_IN', guestCount, status: 'OPEN', openedAt: nowIso(), closedAt: null }
    db.orders.push(o)
    t.status = 'OCCUPIED'
    save()
    return wait(o)
  },
  async setTableStatus(tableId, status) { find('tables', tableId).status = status; save(); return wait(true) },
  async moveTable(orderId, toTableId) {
    const o = find('orders', orderId), to = find('tables', toTableId)
    if (to.status !== 'AVAILABLE') fail(`Bàn ${to.code} không trống`)
    find('tables', o.tableId).status = 'CLEANING'
    o.tableId = toTableId
    to.status = 'OCCUPIED'
    save()
    return wait(o)
  },
  async addOrderItems({ orderId, tableId, type = 'DINE_IN', openedBy, lines, source = 'STAFF' }) {
    if (!lines.length) fail('Chưa chọn món')
    let o = orderId ? find('orders', orderId) : db.orders.find((x) => x.tableId === tableId && x.status === 'OPEN' && tableId)
    if (!o) {
      o = { id: nextId(), tableId: tableId ?? null, type, openedBy, guestCount: 1, status: 'OPEN', openedAt: nowIso(), closedAt: null }
      db.orders.push(o)
      if (tableId) find('tables', tableId).status = 'OCCUPIED'
    }
    lines.forEach((l) => {
      const it = find('items', l.itemId)
      if (!it.isAvailable) fail(`${it.name} đã hết`)
      db.orderItems.push({ id: nextId(), orderId: o.id, itemId: it.id, qty: l.qty, unitPrice: it.price, note: l.note || '', status: 'PENDING', source: l.source || source, createdAt: nowIso(), readyAt: null, servedBy: null, servedAt: null })
    })
    save()
    return wait(o)
  },
  async cancelOrder(orderId) {
    const o = find('orders', orderId)
    if (db.orderItems.some((l) => l.orderId === orderId && l.status !== 'CANCELLED')) fail('Đơn đã có món, không hủy được')
    Object.assign(o, { status: 'CANCELLED', closedAt: nowIso() })
    if (o.tableId) find('tables', o.tableId).status = 'AVAILABLE'
    save()
    return wait(o)
  },
  async cancelOrderItem(id) {
    const l = find('orderItems', id)
    if (l.status !== 'PENDING') fail('Bếp đã nấu, không hủy được')
    l.status = 'CANCELLED'
    save()
    return wait(l)
  },
  async setItemStatus(id, status) {
    const l = find('orderItems', id)
    if (status === 'COOKING' && l.status === 'PENDING') consumeRecipe(l)
    l.status = status
    if (status === 'READY') l.readyAt = nowIso()
    save()
    return wait(l)
  },
  async serveItem(id, userId) {
    Object.assign(find('orderItems', id), { status: 'SERVED', servedBy: userId, servedAt: nowIso() })
    save()
    return wait(true)
  },

  // --- Yêu cầu của khách
  async createServiceRequest(tableId, type) {
    const o = db.orders.find((x) => x.tableId === tableId && x.status === 'OPEN')
    if (db.serviceRequests.some((x) => x.tableId === tableId && x.type === type && x.status !== 'DONE')) fail('Yêu cầu này đã gửi, nhân viên sẽ đến ngay')
    const row = { id: nextId(), tableId, orderId: o?.id ?? null, type, status: 'OPEN', handledBy: null, createdAt: nowIso() }
    db.serviceRequests.push(row)
    save()
    return wait(row)
  },
  async ackRequest(id, userId) { Object.assign(find('serviceRequests', id), { status: 'ACKNOWLEDGED', handledBy: userId, ackAt: nowIso() }); save(); return wait(true) },
  async doneRequest(id, userId) {
    const s = find('serviceRequests', id)
    Object.assign(s, { status: 'DONE', handledBy: s.handledBy ?? userId, doneAt: nowIso() })
    save()
    return wait(true)
  },

  // --- Thanh toán
  async payBill(orderId, { voucherId, pointsUsed = 0, method, cashierId }) {
    const o = find('orders', orderId)
    if (o.status !== 'OPEN') fail('Đơn đã đóng')
    const lines = db.orderItems.filter((l) => l.orderId === orderId)
    if (lines.some((l) => ['PENDING', 'COOKING'].includes(l.status))) fail('Còn món chưa nấu xong')
    const table = o.tableId ? find('tables', o.tableId) : null
    const area = table ? find('areas', table.areaId) : null
    const voucher = voucherId ? find('vouchers', voucherId) : null
    const customer = o.customerId ? find('users', o.customerId) : null
    if (pointsUsed > (customer?.points || 0)) fail('Khách không đủ điểm')
    const b = calcBill({ lines, area, voucher, pointsUsed })
    if (voucher && !b.discount) fail('Voucher không áp dụng được cho hóa đơn này')
    const bill = { id: nextId(), orderId, voucherId: voucher?.id ?? null, ...b, pointsUsed, method, status: 'PAID', cashierId, paidAt: nowIso() }
    db.bills.push(bill)
    if (voucher) voucher.usedCount++
    if (customer) customer.points = customer.points - pointsUsed + b.pointsEarned
    Object.assign(o, { status: 'COMPLETED', closedAt: nowIso() })
    if (table) table.status = 'CLEANING'
    db.serviceRequests.filter((s) => s.orderId === orderId && s.status !== 'DONE').forEach((s) => Object.assign(s, { status: 'DONE', doneAt: nowIso() }))
    save()
    return wait(bill)
  },
  async voidBill(id) {
    const b = find('bills', id)
    if (b.status !== 'PAID') fail('Chỉ hủy được hóa đơn đã thanh toán')
    b.status = 'VOID'
    save()
    return wait(b)
  },

  // --- Đặt bàn
  async setReservationStatus(id, status, { openedBy } = {}) {
    const rv = find('reservations', id)
    if (status === 'SEATED') {
      if (!rv.tableIds.length) fail('Chưa gán bàn cho lượt đặt này')
      for (const tid of rv.tableIds) {
        const t = find('tables', tid)
        if (t.status === 'OCCUPIED') fail(`Bàn ${t.code} đang có khách`)
      }
      rv.tableIds.forEach((tid, i) => {
        find('tables', tid).status = 'OCCUPIED'
        if (i === 0) db.orders.push({ id: nextId(), tableId: tid, reservationId: id, customerId: rv.customerId, openedBy, type: 'DINE_IN', guestCount: rv.guestCount, status: 'OPEN', openedAt: nowIso(), closedAt: null })
      })
    }
    if (['CANCELLED', 'NO_SHOW'].includes(status)) rv.tableIds.forEach((tid) => { const t = find('tables', tid); if (t.status === 'RESERVED') t.status = 'AVAILABLE' })
    // Sắp đến giờ (trong 2 tiếng) thì giữ bàn trên sơ đồ.
    if (status === 'CONFIRMED' && dayjs(rv.time).diff(dayjs(), 'hour', true) < 2) rv.tableIds.forEach((tid) => { const t = find('tables', tid); if (t.status === 'AVAILABLE') t.status = 'RESERVED' })
    rv.status = status
    save()
    return wait(rv)
  },

  // --- Tầng và bàn
  async bulkAddTables({ areaId, prefix, from, count, seats }) {
    const codes = Array.from({ length: count }, (_, i) => `${prefix}${String(from + i).padStart(2, '0')}`)
    const dup = codes.find((c) => db.tables.some((t) => t.code === c))
    if (dup) fail(`Mã bàn ${dup} đã tồn tại`)
    codes.forEach((code) => db.tables.push({ id: nextId(), areaId, code, seats, status: 'AVAILABLE', isActive: true, qrToken: newToken() }))
    save()
    return wait(codes)
  },
  async regenerateQr(tableId) { find('tables', tableId).qrToken = newToken(); save(); return wait(true) },

  // --- Vai trò
  async cloneRole(fromId, { code, name }) {
    const from = find('roles', fromId)
    return api.create('roles', { code, name, description: `Nhân bản từ ${from.name}`, isSystem: false, permissions: [...from.permissions] })
  },

  // --- AI
  async retrain() {
    Object.assign(db.aiModel, { version: `gnn-gcl-${dayjs().format('YYYY-MM-DD')}`, recall20: +(db.aiModel.recall20 + 0.004).toFixed(3), trainedAt: nowIso() })
    save()
    return wait(db.aiModel)
  },
}

function newToken() { return Math.random().toString(36).slice(2, 12) }

function checkUnique(col, data) {
  const rules = { tables: 'code', vouchers: 'code', roles: 'code', users: 'email' }
  const f = rules[col]
  if (f && data[f] && db[col].some((x) => x[f] === data[f] && x.id !== data.id)) fail(`Giá trị "${data[f]}" đã tồn tại`)
  if (col === 'users' && data.phone && db.users.some((x) => x.phone === data.phone && x.id !== data.id)) fail('Số điện thoại đã tồn tại')
}

function applyStock(tx) {
  const ing = find('ingredients', tx.ingredientId)
  const delta = tx.type === 'IMPORT' ? tx.qty : tx.type === 'EXPORT' ? -tx.qty : tx.qty
  if (ing.stock + delta < 0) { db.inventoryTx.pop(); fail(`Tồn kho ${ing.name} không đủ`) }
  ing.stock = +(ing.stock + delta).toFixed(3)
}
function consumeRecipe(line) {
  find('items', line.itemId).recipe.forEach(({ ingredientId, qty }) => {
    const ing = find('ingredients', ingredientId)
    ing.stock = Math.max(0, +(ing.stock - qty * line.qty).toFixed(3))
    db.inventoryTx.push({ id: nextId(), ingredientId, type: 'CONSUME', qty: qty * line.qty, unitCost: ing.cost, note: `Món #${line.id}`, employeeId: null, createdAt: nowIso() })
  })
}

const REMOVE_GUARDS = {
  categories: (id) => db.items.some((i) => i.categoryId === id && !i.deletedAt) && 'Danh mục còn món. Chuyển món sang danh mục khác trước.',
  floors: (id) => db.areas.some((a) => a.floorId === id) && 'Tầng còn khu vực. Xóa khu vực trước.',
  areas: (id) => db.tables.some((t) => t.areaId === id) && 'Khu vực còn bàn. Xóa hoặc chuyển bàn trước.',
  tables: (id) => db.orders.some((o) => o.tableId === id) && 'Bàn đã có đơn. Chỉ ngừng dùng được.',
  vouchers: (id) => find('vouchers', id).usedCount > 0 && 'Voucher đã được dùng. Chỉ tắt được.',
  shifts: (id) => db.schedules.some((s) => s.shiftId === id) && 'Ca đang có lịch làm.',
  ingredients: (id) => db.items.some((i) => !i.deletedAt && i.recipe.some((x) => x.ingredientId === id)) && 'Nguyên liệu đang dùng trong công thức món.',
  roles: (id) => (find('roles', id).isSystem && 'Vai trò hệ thống không xóa được.') || (db.users.some((u) => u.roleId === id) && 'Vai trò đang có người dùng.'),
  users: (id) => (db.orders.some((o) => o.openedBy === id || o.customerId === id) || db.bills.some((b) => b.cashierId === id)) && 'Tài khoản đã có dữ liệu. Hãy khóa thay vì xóa.',
}
