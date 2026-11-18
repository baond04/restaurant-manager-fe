import { cva } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '@/utils/cn'

const button = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap no-underline transition duration-150 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:pointer-events-none disabled:bg-mute disabled:text-ink-soft disabled:border-transparent',
  {
    variants: {
      variant: {
        primary: 'bg-brand-700 text-white hover:bg-brand-800',
        secondary: 'bg-brand-100 text-brand-800 hover:bg-brand-200',
        outline: 'border border-brand-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-50',
        ghost: 'text-brand-800 hover:bg-brand-100',
        inverse: 'bg-white text-brand-800 hover:bg-brand-100',
        danger: 'bg-danger text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-s5',
        md: 'h-10 px-4 text-s4',
        lg: 'h-12 px-6 text-s3',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export function Button({ variant, size, asChild, loading, disabled, className, children, ...props }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp type={asChild ? undefined : 'button'} disabled={asChild ? undefined : disabled || loading} className={cn(button({ variant, size }), className)} {...props}>
      {asChild ? children : <>{loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{children}</>}
    </Comp>
  )
}
