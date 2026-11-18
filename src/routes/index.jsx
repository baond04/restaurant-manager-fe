import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import SiteLayout from '@/layouts/SiteLayout'
import StaffLayout, { RequirePermission } from '@/layouts/StaffLayout'
import { STAFF_NAV } from '@/constants/permissions'

// Mỗi trang tải riêng: khách quét QR không phải tải code của trang quản lý (spec 4).
const pages = {
  dashboard: lazy(() => import('@/pages/staff/DashboardPage')),
  tables: lazy(() => import('@/pages/staff/TablesPage')),
  pos: lazy(() => import('@/pages/staff/PosPage')),
  service: lazy(() => import('@/pages/staff/ServicePage')),
  reservations: lazy(() => import('@/pages/staff/ReservationsPage')),
  bills: lazy(() => import('@/pages/staff/BillsPage')),
  reports: lazy(() => import('@/pages/staff/ReportsPage')),
  menu: lazy(() => import('@/pages/staff/MenuPage')),
  inventory: lazy(() => import('@/pages/staff/InventoryPage')),
  floors: lazy(() => import('@/pages/staff/FloorsPage')),
  staff: lazy(() => import('@/pages/staff/StaffPage')),
  vouchers: lazy(() => import('@/pages/staff/VouchersPage')),
  customers: lazy(() => import('@/pages/staff/CustomersPage')),
  ai: lazy(() => import('@/pages/staff/AiPage')),
  users: lazy(() => import('@/pages/staff/UsersPage')),
  roles: lazy(() => import('@/pages/staff/RolesPage')),
  'my-schedule': lazy(() => import('@/pages/staff/MySchedulePage')),
}
const StaffLogin = lazy(() => import('@/pages/staff/LoginPage'))
const Home = lazy(() => import('@/pages/customer/HomePage'))
const Menu = lazy(() => import('@/pages/customer/MenuPage'))
const Booking = lazy(() => import('@/pages/customer/BookingPage'))
const Account = lazy(() => import('@/pages/customer/AccountPage'))
const Login = lazy(() => import('@/pages/customer/LoginPage'))
const Credits = lazy(() => import('@/pages/customer/CreditsPage'))
const TableOrder = lazy(() => import('@/pages/table-order/TableOrderPage'))
const DevUi = lazy(() => import('@/pages/dev/DevUiPage'))

export const router = createBrowserRouter([
  {
    path: '/', element: <SiteLayout />, children: [
      { index: true, element: <Home /> },
      { path: 'menu', element: <Menu /> },
      { path: 'booking', element: <Booking /> },
      { path: 'account', element: <Account /> },
      { path: 'login', element: <Login /> },
      { path: 'credits', element: <Credits /> },
    ],
  },
  { path: '/t/:qrToken', element: <TableOrder /> },
  { path: '/staff/login', element: <StaffLogin /> },
  {
    path: '/staff', element: <StaffLayout />, children: STAFF_NAV.map((n) => {
      const Page = pages[n.path]
      return { path: n.path, element: <RequirePermission any={n.any}><Page /></RequirePermission> }
    }),
  },
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <DevUi /> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
])
