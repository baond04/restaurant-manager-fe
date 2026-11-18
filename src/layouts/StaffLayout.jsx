import {
  Armchair, Bell, BookOpen, Building2, CalendarClock, CalendarDays, ChartColumn, ChefHat, ClipboardList, ConciergeBell,
  LayoutDashboard, LogOut, Menu as MenuIcon, Package, ReceiptText, Search, ShieldCheck, Sparkles, Star, Ticket, UserCog, Users,
} from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand'
import { EmptyState, PageLoader } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/ui/command'
import { Sheet, SheetContent } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { signOut } from '@/services/api'
import { useCol } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { canSee, STAFF_NAV } from '@/constants/permissions'
import { REQUEST_TYPE } from '@/constants'
import { cn } from '@/utils/cn'
import { dayjs, fmtTime } from '@/utils/format'

const ICONS = { LayoutDashboard, Armchair, ClipboardList, ConciergeBell, CalendarDays, ReceiptText, ChefHat, ChartColumn, BookOpen, Package, Building2, Users, Ticket, Star, Sparkles, UserCog, ShieldCheck, CalendarClock }
const FULL_BLEED = new Set(['tables']) // trang tự quản lý lề và vùng cuộn

function useNavCounts() {
  const { data: reqs } = useCol('serviceRequests')
  const { data: lines } = useCol('orderItems')
  const { data: res } = useCol('reservations')
  return {
    service: reqs.filter((r) => r.status !== 'DONE').length + lines.filter((l) => l.status === 'READY').length,
    kitchen: lines.filter((l) => l.status === 'PENDING' || l.status === 'COOKING').length,
    reservations: res.filter((r) => r.status === 'PENDING').length,
  }
}

function Sidebar({ visible, counts, user, onNavigate }) {
  const nav = useNavigate()
  return (
    <div className="flex h-full flex-col bg-brand-700 text-white">
      <div className="flex h-16 shrink-0 items-center px-5"><Logo tone="white" /></div>
      <nav aria-label="Menu nhân viên" className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
        {[...new Set(visible.map((n) => n.group))].map((g) => (
          <div key={g} className="mt-3 first:mt-0">
            <p className="px-3 pb-1 text-s6 font-medium text-brand-100">{g}</p>
            <div className="space-y-0.5">
              {visible.filter((n) => n.group === g).map((n) => {
                const Icon = ICONS[n.icon]
                return (
                  <NavLink key={n.path} to={`/staff/${n.path}`} onClick={onNavigate} className={({ isActive }) => cn('group flex h-10 items-center gap-3 rounded-control px-3 text-s4 font-medium no-underline transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white', isActive ? 'bg-white font-semibold text-brand-800' : 'text-white hover:bg-brand-800')}>
                    {({ isActive }) => (
                      <>
                        <Icon size={18} aria-hidden="true" />
                        <span className="flex-1 truncate">{n.label}</span>
                        {counts[n.path] > 0 && <span className={cn('rounded-full px-2 text-s6 font-bold tabular-nums', isActive ? 'bg-brand-100 text-brand-800' : 'bg-brand-900 text-white')}>{counts[n.path]}</span>}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-brand-600 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-control p-1.5 text-left transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-s3 font-bold text-brand-800">{user.fullName.split(' ').at(-1)[0]}</span>
            <span className="min-w-0"><span className="block truncate text-s5 font-semibold">{user.fullName}</span><span className="block truncate text-s6 text-brand-100">{user.position}</span></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem danger onSelect={() => signOut().then(() => nav('/staff/login'))}><LogOut size={16} aria-hidden="true" />Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function Bell_({ canHandle }) {
  const { data: reqs } = useCol('serviceRequests')
  const { data: tables } = useCol('tables')
  const open = reqs.filter((r) => r.status === 'OPEN').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (!canHandle) return null
  return (
    <Popover>
      <PopoverTrigger aria-label={`Thông báo, ${open.length} yêu cầu mới`} className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-800 transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-700">
        <Bell size={19} aria-hidden="true" />
        {open.length > 0 && <span className="absolute top-1 right-1 flex size-4.5 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white tabular-nums">{open.length}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-brand-100 px-4 py-3 text-s4 font-bold text-ink">Yêu cầu mới</p>
        {open.length === 0 && <p className="px-4 py-6 text-center text-s4 text-ink-soft">Không có yêu cầu</p>}
        <div className="max-h-72 overflow-y-auto">
          {open.map((r) => (
            <Link key={r.id} to="/staff/service" className="flex items-center justify-between gap-3 px-4 py-2.5 text-s4 no-underline transition hover:bg-brand-50">
              <span className="text-ink"><b className="font-semibold">{tables.find((t) => t.id === r.tableId)?.code}</b> · {REQUEST_TYPE[r.type]}</span>
              <span className="text-s5 text-ink-soft tabular-nums">{fmtTime(r.createdAt)}</span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function StaffLayout() {
  const { user, perms, can, loading } = useStaff()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const counts = useNavCounts()
  const { data: tables } = useCol('tables')
  const { data: schedules } = useCol('schedules')
  const { data: shifts } = useCol('shifts')
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/staff/login" replace />

  const visible = STAFF_NAV.filter((n) => canSee(n, perms))
  const current = pathname.split('/')[2] || ''
  if (!current && visible[0]) return <Navigate to={`/staff/${visible[0].path}`} replace />
  const page = STAFF_NAV.find((n) => n.path === current)
  const today = dayjs().format('YYYY-MM-DD')
  const shift = shifts.find((s) => s.id === schedules.find((x) => x.employeeId === user.id && x.date === today)?.shiftId)
  const groups = [
    { heading: 'Trang', items: visible.map((n) => { const Icon = ICONS[n.icon]; return { id: `p-${n.path}`, label: n.label, icon: <Icon size={16} aria-hidden="true" />, onSelect: () => { nav(`/staff/${n.path}`); setSearch(false) } } }) },
    ...(can('table:view') ? [{ heading: 'Bàn', items: tables.filter((t) => t.isActive).map((t) => ({ id: `t-${t.id}`, label: `Bàn ${t.code}`, icon: <Armchair size={16} aria-hidden="true" />, onSelect: () => { nav(`/staff/tables?table=${t.id}`); setSearch(false) } })) }] : []),
  ]
  const sidebarProps = { visible, counts, user }

  return (
    <div className="flex h-dvh overflow-hidden bg-white font-sans text-s4 text-ink">
      <aside className="hidden w-64 shrink-0 lg:block"><Sidebar {...sidebarProps} /></aside>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" title="Menu" hideHeader className="max-w-64 [&>button]:text-white [&>button]:hover:bg-brand-800 [&>button]:hover:text-white"><Sidebar {...sidebarProps} onNavigate={() => setMenu(false)} /></SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-brand-100 bg-white px-3 lg:px-6">
          <Button variant="ghost" size="icon" aria-label="Mở menu" className="lg:hidden" onClick={() => setMenu(true)}><MenuIcon size={20} aria-hidden="true" /></Button>
          <h1 className="text-s2 font-bold text-ink">{page?.label}</h1>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {shift && <span className="hidden text-s5 text-ink-soft md:inline">{shift.name} · {shift.start}–{shift.end}</span>}
            <button type="button" onClick={() => setSearch(true)} className="flex h-9 cursor-pointer items-center gap-2 rounded-control border border-brand-200 px-3 text-s5 text-ink-soft transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700">
              <Search size={15} className="text-brand-700" aria-hidden="true" /><span className="hidden sm:inline">Tìm nhanh</span><kbd className="hidden rounded bg-brand-100 px-1.5 text-s6 font-semibold text-brand-800 sm:inline">Ctrl K</kbd>
            </button>
            <Bell_ canHandle={can('request:handle')} />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Suspense fallback={<PageLoader className="min-h-full" />}>
            {FULL_BLEED.has(current) ? <Outlet /> : <div className="main"><Outlet /></div>}
          </Suspense>
        </main>
      </div>
      <CommandPalette open={search} onOpenChange={setSearch} groups={groups} />
    </div>
  )
}

/** Chặn route theo quyền (spec 7.3). Chỉ để ẩn giao diện; backend mới là lớp bảo vệ. */
export function RequirePermission({ any, children }) {
  const { perms } = useStaff()
  if (!any.some((p) => perms.includes(p))) return <EmptyState icon={ShieldCheck} title="Không có quyền" className="min-h-[60dvh]">Vai trò của bạn chưa được cấp quyền vào trang này.</EmptyState>
  return children
}
