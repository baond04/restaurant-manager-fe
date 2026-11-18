import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'
import { cn } from '@/utils/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const navBtn = 'absolute top-0 flex size-8 cursor-pointer items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100 disabled:opacity-30 [&_svg]:fill-current [&_svg]:size-3.5'

/** selected, onSelect nhận Date. */
export function Calendar({ selected, onSelect, disabled, defaultMonth }) {
  return (
    <DayPicker mode="single" required locale={vi} weekStartsOn={1} selected={selected} onSelect={onSelect} disabled={disabled} defaultMonth={defaultMonth ?? selected}
      classNames={{
        root: 'relative w-fit text-s4 text-ink',
        months: 'flex',
        month_caption: 'flex h-8 items-center justify-center font-semibold capitalize',
        nav: '',
        button_previous: cn(navBtn, 'left-0'),
        button_next: cn(navBtn, 'right-0'),
        weekdays: 'flex',
        weekday: 'size-9 text-center text-s6 leading-9 font-medium text-ink-soft',
        week: 'flex',
        day: 'size-9 p-0.5 text-center',
        day_button: 'size-8 cursor-pointer rounded-lg transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        today: 'font-bold text-brand-700',
        selected: '[&_button]:bg-brand-700 [&_button]:text-white [&_button]:hover:bg-brand-800',
        outside: 'opacity-40',
        disabled: 'opacity-35',
      }} />
  )
}

/** Nút hiện ngày, bấm mở lịch. value, onChange dùng Date. */
export function DatePicker({ value, onChange, disabled, className, 'aria-label': label }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={label} className={cn('flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-brand-200 bg-white px-3 text-s4 text-ink transition hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-brand-700', className)}>
        {value ? value.toLocaleDateString('vi-VN') : 'Chọn ngày'}
        <CalendarDays size={16} className="text-brand-700" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-auto"><Calendar selected={value} onSelect={(d) => { onChange(d); setOpen(false) }} disabled={disabled} /></PopoverContent>
    </Popover>
  )
}
