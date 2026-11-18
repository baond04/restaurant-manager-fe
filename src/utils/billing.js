export const VAT_RATE = 0.08
export const POINT_VALUE = 1000 // 1 điểm = 1.000đ
export const POINT_EARN_PER = 10000 // mỗi 10.000đ thanh toán được 1 điểm

/** Giảm giá của voucher trên tạm tính; 0 nếu không đủ điều kiện. */
export function voucherDiscount(voucher, subtotal, now = new Date()) {
  if (!voucher || !voucher.isActive) return 0
  if (new Date(voucher.startAt) > now || new Date(voucher.endAt) < now) return 0
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return 0
  if (subtotal < (voucher.minOrderAmount || 0)) return 0
  const raw = voucher.type === 'PERCENT' ? Math.round((subtotal * voucher.value) / 100) : voucher.value
  return Math.min(raw, voucher.maxDiscount || raw, subtotal)
}

/**
 * Tính hóa đơn. lines: [{ qty, unitPrice, status }]; area: { serviceFeePercent, minSpend }.
 * Thứ tự: tạm tính → phụ thu khu vực → bù mức chi tối thiểu → voucher → điểm → VAT.
 */
export function calcBill({ lines, area, voucher, pointsUsed = 0, now }) {
  const subtotal = lines.filter((l) => l.status !== 'CANCELLED').reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const serviceFee = Math.round((subtotal * (area?.serviceFeePercent || 0)) / 100)
  const minSpendTopUp = Math.max(0, (area?.minSpend || 0) - subtotal)
  const discount = voucherDiscount(voucher, subtotal, now)
  const beforePoints = subtotal + serviceFee + minSpendTopUp - discount
  const pointsAmount = Math.min(pointsUsed * POINT_VALUE, beforePoints)
  const taxable = beforePoints - pointsAmount
  const tax = Math.round(taxable * VAT_RATE)
  const total = taxable + tax
  return { subtotal, serviceFee, minSpendTopUp, discount, pointsAmount, tax, total, pointsEarned: Math.floor(total / POINT_EARN_PER) }
}
