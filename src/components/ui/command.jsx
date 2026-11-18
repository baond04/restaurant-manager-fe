import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import { norm } from '@/utils/format'

// cmdk mặc định phân biệt dấu; so khớp không dấu để gõ "so do" ra "Sơ đồ bàn".
const filter = (value, search) => (norm(value).includes(norm(search)) ? 1 : 0)

/** Ô tìm dùng chung cho Ctrl+K và Combobox. groups: [{ heading, items: [{ id, label, icon, onSelect }] }]. */
export function CommandList({ groups, placeholder = 'Tìm', empty = 'Không có kết quả' }) {
  return (
    <Command filter={filter} label={placeholder}>
      <div className="flex items-center gap-2 border-b border-brand-100 px-3">
        <Search size={16} className="text-brand-700" aria-hidden="true" />
        <Command.Input placeholder={placeholder} className="h-11 w-full bg-transparent text-s4 text-ink outline-none placeholder:text-ink-soft" />
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-1">
        <Command.Empty className="px-3 py-6 text-center text-s4 text-ink-soft">{empty}</Command.Empty>
        {groups.map((g) => (
          <Command.Group key={g.heading ?? 'all'} heading={g.heading} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-s6 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-soft">
            {g.items.map((it) => (
              <Command.Item key={it.id} value={`${it.label} ${it.id}`} onSelect={it.onSelect} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-s4 text-ink data-[selected=true]:bg-brand-100 data-[selected=true]:text-brand-900">
                {it.icon}{it.label}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  )
}

export function CommandPalette({ open, onOpenChange, groups }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[1000] animate-fade bg-ink/40" />
        <D.Content aria-describedby={undefined} className="fixed top-[15%] left-1/2 z-[1000] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 animate-fade overflow-hidden rounded-panel bg-white shadow-float">
          <D.Title className="sr-only">Tìm nhanh</D.Title>
          <CommandList groups={groups} placeholder="Tìm trang, bàn" />
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
