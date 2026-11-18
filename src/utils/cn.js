import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Dạy tailwind-merge các cỡ chữ riêng, nếu không text-d1 bị coi là màu chữ và làm mất text-white.
const merge = extendTailwindMerge({
  extend: { theme: { text: ['d1', 'd2', 'd3', 'd4', 'body', 's1', 's2', 's3', 's4', 's5', 's6'] } },
})

export const cn = (...inputs) => merge(clsx(inputs))
