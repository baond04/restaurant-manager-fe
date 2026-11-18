import { CalendarDays, House, LogOut, MessageCircle, QrCode, User, UtensilsCrossed } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Logo } from '@/components/brand'
import { PageLoader } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import ChatWidget from '@/components/chat/ChatWidget'
import JoinTableDialog from '@/pages/table-order/components/JoinTableDialog'
import { useCol } from '@/hooks/useApi'
import { signOut } from '@/services/api'
import { useCustomer } from '@/stores/authStore'
import { cn } from '@/utils/cn'

const LINKS = [['/menu', 'Thực đơn'], ['/booking', 'Đặt bàn']]
const initial = (name) => name.split(' ').at(-1)[0]

export default function SiteLayout() {
  const { isLoading } = useCol('users')
  const me = useCustomer()
  const [chat, setChat] = useState(false)
  const [join, setJoin] = useState(false)

  // Chờ danh sách tài khoản, nếu không trang Tài khoản sẽ tưởng chưa đăng nhập khi tải lại.
  if (isLoading) return <PageLoader />

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-body text-ink">
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Trang chủ"><Logo /></Link>
          <nav aria-label="Chính" className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('rounded-control px-3.5 py-2 text-s3 font-medium transition hover:bg-brand-50', isActive ? 'text-brand-700' : 'text-ink')}>{label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setJoin(true)} className="hidden lg:inline-flex"><QrCode size={17} aria-hidden="true" />Gọi món tại bàn</Button>
            <AccountMenu me={me} />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 lg:pb-0"><Suspense fallback={<PageLoader className="min-h-[60dvh]" />}><Outlet /></Suspense></main>

      <footer className="border-t border-brand-100 pb-20 lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-s5 text-ink-soft sm:px-6 lg:px-8">
          <span>Nhà Hàng Cam · Nguyễn Trãi, Thanh Xuân, Hà Nội</span>
          <span className="flex gap-4">
            <Link to="/credits" className="hover:text-brand-700">Nguồn ảnh</Link>
            <Link to="/staff/login" className="hover:text-brand-700">Nhân viên</Link>
          </span>
        </div>
      </footer>

      <BottomNav onJoin={() => setJoin(true)} />
      <button type="button" aria-label="Hỏi trợ lý" onClick={() => setChat(true)} className="fixed right-4 bottom-24 z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-brand-700 text-white shadow-float transition hover:-translate-y-0.5 hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:bottom-6">
        <MessageCircle size={24} aria-hidden="true" />
      </button>
      <ChatWidget open={chat} onClose={() => setChat(false)} />
      <JoinTableDialog open={join} onOpenChange={setJoin} />
    </div>
  )
}

function AccountMenu({ me }) {
  const nav = useNavigate()
  if (!me) return <Button variant="outline" onClick={() => nav('/login')}>Đăng nhập</Button>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Tài khoản" className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-brand-100 text-s3 font-bold text-brand-800 transition hover:bg-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">{initial(me.fullName)}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => nav('/account')}><User size={16} aria-hidden="true" />Tài khoản</DropdownMenuItem>
        <DropdownMenuItem danger onSelect={() => signOut().then(() => nav('/'))}><LogOut size={16} aria-hidden="true" />Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const tab = ({ isActive }) => cn('flex flex-1 flex-col items-center justify-center gap-0.5 text-s6 font-medium', isActive ? 'text-brand-700' : 'text-ink-soft')

function BottomNav({ onJoin }) {
  const me = useCustomer()
  return (
    <nav aria-label="Điều hướng nhanh" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <NavLink to="/" end className={tab}><House size={21} aria-hidden="true" />Trang chủ</NavLink>
      <NavLink to="/menu" className={tab}><UtensilsCrossed size={21} aria-hidden="true" />Thực đơn</NavLink>
      <button type="button" onClick={onJoin} className="flex flex-1 cursor-pointer flex-col items-center text-s6 font-semibold text-brand-700">
        <span className="-mt-5 mb-0.5 flex size-13 items-center justify-center rounded-full bg-brand-700 text-white shadow-float"><QrCode size={24} aria-hidden="true" /></span>
        Gọi món
      </button>
      <NavLink to="/booking" className={tab}><CalendarDays size={21} aria-hidden="true" />Đặt bàn</NavLink>
      <NavLink to={me ? '/account' : '/login'} className={tab}><User size={21} aria-hidden="true" />Tài khoản</NavLink>
    </nav>
  )
}
