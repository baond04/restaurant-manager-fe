import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Inbox } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/feedback'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/data/EmptyState'

const SIZES = [10, 20, 50].map((n) => ({ value: n, label: `${n} dòng` }))

/** Bảng dùng chung. columns theo TanStack Table; meta.align = 'right' cho cột số. */
export function DataTable({ columns, data, loading, empty = 'Không có dữ liệu', onRowClick, pageSize = 10 }) {
  const [sorting, setSorting] = useState([])
  const table = useReactTable({
    data, columns, state: { sorting }, onSortingChange: setSorting,
    initialState: { pagination: { pageSize } },
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
  })
  const { pageIndex, pageSize: size } = table.getState().pagination
  const total = data.length
  const align = (c) => (c.columnDef.meta?.align === 'right' ? 'text-right' : 'text-left')

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-s4">
          <thead className="sticky top-0 z-[1] bg-white">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-brand-100">
                {hg.headers.map((h) => {
                  const dir = h.column.getIsSorted()
                  const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ChevronsUpDown
                  return (
                    <th key={h.id} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined} className={cn('h-11 px-4 text-s5 font-medium whitespace-nowrap text-ink-soft', align(h.column))}>
                      {h.column.getCanSort()
                        ? <button type="button" onClick={h.column.getToggleSortingHandler()} className="inline-flex cursor-pointer items-center gap-1 hover:text-brand-800">{flexRender(h.column.columnDef.header, h.getContext())}<Icon size={13} aria-hidden="true" /></button>
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }, (_, i) => (
              <tr key={i} className="border-b border-brand-50">{columns.map((c, j) => <td key={j} className="px-4 py-3.5"><Skeleton className="h-4" /></td>)}</tr>
            ))}
            {!loading && table.getRowModel().rows.map((r) => (
              <tr key={r.id} onClick={onRowClick ? () => onRowClick(r.original) : undefined} className={cn('border-b border-brand-50 transition last:border-0 hover:bg-brand-50', onRowClick && 'cursor-pointer')}>
                {r.getVisibleCells().map((c) => <td key={c.id} className={cn('px-4 py-3 text-ink', align(c.column))}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !total && <EmptyState icon={Inbox} title={empty} />}
      </div>
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 px-4 py-3">
          <span className="text-s5 text-ink-soft tabular-nums">{pageIndex * size + 1}–{Math.min((pageIndex + 1) * size, total)} / {total}</span>
          <div className="flex items-center gap-2">
            <Select aria-label="Số dòng mỗi trang" className="h-8 w-28 text-s5" value={size} onValueChange={table.setPageSize} options={SIZES} />
            <Button size="icon-sm" variant="outline" aria-label="Trang trước" disabled={!table.getCanPreviousPage()} onClick={table.previousPage}><ChevronLeft size={16} aria-hidden="true" /></Button>
            <Button size="icon-sm" variant="outline" aria-label="Trang sau" disabled={!table.getCanNextPage()} onClick={table.nextPage}><ChevronRight size={16} aria-hidden="true" /></Button>
          </div>
        </div>
      )}
    </>
  )
}
