import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { DishPhoto, ItemProgress, Logo, Money, QtyStepper, StatusPill } from '@/components/brand'
import { TableShape } from '@/components/brand/TableShape'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/data/EmptyState'
import { FilterBar, FormDialog, ListPage, RowActions, StatusChips } from '@/components/data/ListPage'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/calendar'
import { Checkbox, Switch } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogFooter, Sheet, SheetContent } from '@/components/ui/dialog'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge, Skeleton, Tip } from '@/components/ui/feedback'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TABLE_STATUS } from '@/constants'
import { shapeFor } from '@/utils/floor'

const Row = ({ title, children }) => <section className="space-y-3 border-t border-brand-100 pt-5"><h2 className="text-s3 font-bold">{title}</h2><div className="flex flex-wrap items-center gap-3">{children}</div></section>
const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger']
const OPTS = ['18:00', '18:30', '19:00'].map((v) => ({ value: v, label: v })).concat({ value: '19:30', label: '19:30 · Hết chỗ', disabled: true })
const ROWS = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: `Món thử ${i + 1}`, price: 25000 + i * 500 }))
const COLS = [
  { accessorKey: 'name', header: 'Tên món' },
  { accessorKey: 'price', header: 'Giá', meta: { align: 'right' }, cell: (c) => <Money value={c.getValue()} /> },
  { id: 'act', header: '', enableSorting: false, cell: () => <RowActions onEdit={() => {}} onDelete={() => {}} /> },
]

/** Bảng thành phần, chỉ có ở chế độ dev. */
export default function DevUiPage() {
  const [sel, setSel] = useState('18:30')
  const [date, setDate] = useState(new Date())
  const [combo, setCombo] = useState()
  const [qty, setQty] = useState(0)
  const [chip, setChip] = useState('all')
  const [modal, setModal] = useState(null)

  return (
    <div className="mx-auto max-w-5xl space-y-6 bg-white p-8 font-sans text-s4 text-ink">
      <Logo />
      <Row title="Button">
        {VARIANTS.map((v) => <Button key={v} variant={v}>{v}</Button>)}
        <Button loading>Đang lưu</Button><Button disabled>Tắt</Button><Button size="sm">Nhỏ</Button><Button size="lg">Lớn</Button><Button size="icon" aria-label="Sửa"><Pencil size={16} /></Button>
        <span className="rounded-panel bg-brand-700 p-3"><Button variant="inverse">inverse</Button></span>
      </Row>
      <Row title="Ô nhập">
        <Field label="Thường" className="w-56">{(f) => <Input {...f} placeholder="Nhập" />}</Field>
        <Field label="Lỗi" error="Bắt buộc" className="w-56">{(f) => <Input {...f} />}</Field>
        <Field label="Tắt" className="w-56">{(f) => <Input {...f} disabled value="Không sửa" readOnly />}</Field>
        <Field label="Nhiều dòng" className="w-56">{(f) => <Textarea {...f} rows={2} />}</Field>
      </Row>
      <Row title="Chọn">
        <div className="w-44"><Select value={sel} onValueChange={setSel} options={OPTS} aria-label="Giờ" /></div>
        <div className="w-44"><DatePicker value={date} onChange={setDate} aria-label="Ngày" /></div>
        <div className="w-56"><Combobox value={combo} onChange={setCombo} options={['Phở bò tái', 'Bún chả', 'Bánh xèo'].map((v) => ({ value: v, label: v }))} aria-label="Món" /></div>
        <Checkbox defaultChecked aria-label="Chọn" /><Checkbox aria-label="Chọn" /><Checkbox disabled aria-label="Tắt" /><Switch defaultChecked aria-label="Bật" /><Switch aria-label="Tắt" />
        <QtyStepper value={qty} onChange={setQty} label="món" />
      </Row>
      <Row title="Lớp nổi">
        <Button variant="outline" onClick={() => setModal('dialog')}>Dialog</Button>
        <Button variant="outline" onClick={() => setModal('sheet')}>Sheet</Button>
        <Button variant="outline" onClick={() => setModal('drawer')}>Drawer</Button>
        <Button variant="outline" onClick={() => setModal('form')}>FormDialog</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Sửa</DropdownMenuItem><DropdownMenuItem danger>Xóa</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Popover><PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger><PopoverContent>Nội dung</PopoverContent></Popover>
        <Tip label="Chú thích"><Button variant="outline">Tooltip</Button></Tip>
      </Row>
      <Row title="Hiển thị">
        {['soft', 'solid', 'outline', 'mute', 'danger'].map((t) => <Badge key={t} tone={t}>{t}</Badge>)}
        {Object.keys(TABLE_STATUS).map((s) => <StatusPill key={s} map={TABLE_STATUS} value={s} />)}
        <Skeleton className="h-6 w-32" /><Money value={245000} /><DishPhoto src="/img/pho.jpg" className="size-16 rounded-xl" /><DishPhoto src="/img/khong-co.jpg" className="size-16 rounded-xl" />
        <Tabs defaultValue="a"><TabsList><TabsTrigger value="a">Một</TabsTrigger><TabsTrigger value="b">Hai</TabsTrigger></TabsList><TabsContent value="a" /><TabsContent value="b" /></Tabs>
      </Row>
      <section className="space-y-3 border-t border-brand-100 pt-5">
        <h2 className="text-s3 font-bold">Tiến độ món</h2>
        <div className="grid grid-cols-5 gap-4">{['PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED'].map((s) => <ItemProgress key={s} status={s} />)}</div>
      </section>
      <section className="space-y-3 border-t border-brand-100 pt-5">
        <h2 className="text-s3 font-bold">Bàn</h2>
        <div className="dot-grid relative h-[260px] rounded-site bg-brand-50">
          {['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'DISABLED'].flatMap((status, i) => [2, 4, 8].map((seats, j) => (
            <TableShape key={status + seats} table={{ code: `B${i}${j}`, seats, shape: shapeFor(seats) }} status={status} alert={status === 'OCCUPIED' && j === 1} selected={status === 'AVAILABLE' && j === 0} line2={`${seats} chỗ`} style={{ left: 12 + i * 178 + (j === 2 ? 0 : 0), top: 8 + j * 82 }} className="scale-[.8] origin-top-left" />
          )))}
        </div>
      </section>
      <EmptyState title="Trạng thái trống" icon={Pencil}>Mô tả ngắn</EmptyState>
      <ListPage title="Bảng 200 dòng" actions={<Button>Thêm</Button>} chips={<StatusChips value={chip} onChange={setChip} options={[{ value: 'all', label: 'Tất cả', count: 200 }, { value: 'a', label: 'Đang bán', count: 180 }]} />} filters={<FilterBar search="" onSearch={() => {}} onReset={() => {}} />}>
        <DataTable columns={COLS} data={ROWS} />
      </ListPage>
      <DataTable columns={COLS} data={[]} loading />
      <DataTable columns={COLS} data={[]} />

      <Dialog open={modal === 'dialog'} onOpenChange={() => setModal(null)}><DialogContent title="Tiêu đề" description="Mô tả">Nội dung<DialogFooter><Button>Xong</Button></DialogFooter></DialogContent></Dialog>
      <Sheet open={modal === 'sheet'} onOpenChange={() => setModal(null)}><SheetContent title="Sheet"><div className="p-5">Nội dung</div></SheetContent></Sheet>
      <Drawer open={modal === 'drawer'} onOpenChange={() => setModal(null)}><DrawerContent title="Drawer"><div className="h-48 p-5">Nội dung</div></DrawerContent></Drawer>
      <FormDialog open={modal === 'form'} onOpenChange={() => setModal(null)} title="Thêm món" onSubmit={(e) => e.preventDefault()}>
        <Field label="Tên">{(f) => <Input {...f} />}</Field><Field label="Giá">{(f) => <Input {...f} />}</Field><Field label="Mô tả" className="md:col-span-2">{(f) => <Textarea {...f} />}</Field>
      </FormDialog>
    </div>
  )
}
