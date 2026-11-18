import { describe, expect, it } from 'vitest'
import { buildSeed } from '@/mocks/seed'
import { tableBox } from '@/utils/floor'

describe('sơ đồ bàn mẫu', () => {
  const { areas, tables } = buildSeed()
  const rect = (t) => { const { w, h } = tableBox(t); return { l: t.posX, t: t.posY, r: t.posX + w, b: t.posY + h } }

  it('mỗi bàn nằm trong khu vực của nó', () => {
    tables.forEach((t) => {
      const a = areas.find((x) => x.id === t.areaId), b = rect(t)
      expect(b.l >= 0 && b.t >= 0 && b.r <= a.planW && b.b <= a.planH, `${t.code} ra ngoài ${a.name}`).toBe(true)
    })
  })

  it('không có hai bàn chồng nhau', () => {
    tables.forEach((x, i) => tables.slice(i + 1).filter((y) => y.areaId === x.areaId).forEach((y) => {
      const a = rect(x), b = rect(y)
      expect(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t, `${x.code} chồng ${y.code}`).toBe(true)
    }))
  })
})
