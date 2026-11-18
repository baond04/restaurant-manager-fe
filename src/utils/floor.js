// Hình học sơ đồ bàn: dữ liệu mẫu, kiểm thử và TableShape dùng chung một nguồn kích thước.
const RECT_WIDTH = { 6: 148, 8: 176, 10: 204, 12: 232, 16: 300, 20: 360 }
const CHAIR = 18 // bề dày phần ghế bao quanh mặt bàn

export const shapeFor = (seats) => (seats <= 2 ? 'ROUND' : seats <= 4 ? 'SQUARE' : 'RECT')

export function tableBox({ seats, shape }) {
  if (shape === 'ROUND') return { w: 96, h: 96 }
  if (shape === 'SQUARE') return { w: 104, h: 104 }
  return { w: RECT_WIDTH[seats] ?? 120 + seats * 12, h: 104 }
}

/** Vị trí từng ghế quanh mặt bàn: [{ x, y, w, h, rx }]. */
export function chairsFor({ seats, shape }, { w, h }) {
  const long = 22, thin = 11
  if (shape === 'ROUND') {
    const c = w / 2, r = w / 2 - thin / 2 - 1
    return Array.from({ length: seats }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats
      return { x: c + r * Math.cos(a) - long / 2, y: c + r * Math.sin(a) - thin / 2, w: long, h: thin, rx: 5, rotate: (a * 180) / Math.PI + 90, cx: c + r * Math.cos(a), cy: c + r * Math.sin(a) }
    })
  }
  const side = (y, n) => Array.from({ length: n }, (_, i) => ({ x: CHAIR + ((w - 2 * CHAIR) * (i + 0.5)) / n - long / 2, y, w: long, h: thin, rx: 5 }))
  const end = (x) => ({ x, y: h / 2 - long / 2, w: thin, h: long, rx: 5 })
  if (shape === 'SQUARE') return [...side(2, 1), ...side(h - thin - 2, 1), end(2), end(w - thin - 2)]
  const perSide = Math.floor((seats - 2) / 2)
  return [...side(2, perSide), ...side(h - thin - 2, seats - 2 - perSide), end(2), end(w - thin - 2)]
}

export const TABLE_INSET = CHAIR
