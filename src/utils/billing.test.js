import { describe, expect, it } from 'vitest'
import { calcBill, voucherDiscount } from '@/utils/billing'

const now = new Date('2026-11-08T12:00:00+07:00')
const v = { isActive: true, startAt: '2026-11-01', endAt: '2026-11-30', type: 'PERCENT', value: 10, maxDiscount: 50000, minOrderAmount: 200000, usageLimit: 100, usedCount: 0 }

describe('voucherDiscount', () => {
  it('caps percent discount at maxDiscount', () => expect(voucherDiscount(v, 1000000, now)).toBe(50000))
  it('returns 0 under min order amount', () => expect(voucherDiscount(v, 100000, now)).toBe(0))
  it('returns 0 when expired', () => expect(voucherDiscount({ ...v, endAt: '2026-11-05' }, 1000000, now)).toBe(0))
  it('returns 0 when usage limit reached', () => expect(voucherDiscount({ ...v, usedCount: 100 }, 1000000, now)).toBe(0))
})

describe('calcBill', () => {
  it('ignores cancelled lines and adds VAT', () => {
    const b = calcBill({ lines: [{ qty: 2, unitPrice: 50000 }, { qty: 1, unitPrice: 90000, status: 'CANCELLED' }], now })
    expect(b.subtotal).toBe(100000)
    expect(b.tax).toBe(8000)
    expect(b.total).toBe(108000)
  })
  it('VIP room: service fee plus top-up to min spend', () => {
    const b = calcBill({ lines: [{ qty: 1, unitPrice: 2000000 }], area: { serviceFeePercent: 10, minSpend: 3000000 }, now })
    expect(b.serviceFee).toBe(200000)
    expect(b.minSpendTopUp).toBe(1000000)
    expect(b.total).toBe(Math.round(3200000 * 1.08))
  })
  it('points never push total below zero', () => {
    const b = calcBill({ lines: [{ qty: 1, unitPrice: 10000 }], pointsUsed: 999, now })
    expect(b.pointsAmount).toBe(10000)
    expect(b.total).toBe(0)
  })
})
