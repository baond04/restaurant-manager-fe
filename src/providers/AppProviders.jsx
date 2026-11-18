import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/feedback'
import { refreshSession } from '@/services/httpClient'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } } })

export const theme = {
  token: {
    colorPrimary: '#c2410c', // cam đậm: chữ trắng trên nền này đạt tương phản AA
    colorLink: '#c2410c',
    colorInfo: '#1d4ed8',
    colorSuccess: '#15803d',
    colorWarning: '#a16207',
    colorError: '#b91c1c',
    colorText: '#1f1b18',
    colorTextSecondary: '#5c5650',
    colorTextTertiary: '#7a736c',
    colorTextPlaceholder: '#7a736c',
    colorBorder: '#dcd7d0',
    colorBorderSecondary: '#ece8e3',
    colorBgLayout: '#ffffff',
    borderRadius: 6,
    controlHeight: 34,
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    fontWeightStrong: 600,
    boxShadowSecondary: '0 4px 16px rgba(31,27,24,.1)',
  },
  components: {
    Button: { primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none', fontWeight: 500 },
    Menu: { itemHeight: 32, itemMarginBlock: 0, groupTitleLineHeight: 1.2, itemMarginInline: 0, itemBorderRadius: 6, itemSelectedBg: '#fff1e6', itemSelectedColor: '#9a3412', itemHoverBg: '#f5f2ee', itemColor: '#5c5650', groupTitleColor: '#7a736c', groupTitleFontSize: 12, iconSize: 18, iconMarginInlineEnd: 10 },
    Table: { headerBg: '#ffffff', headerColor: '#7a736c', headerSplitColor: 'transparent', cellPaddingBlock: 10, cellPaddingInline: 12, rowHoverBg: '#faf8f5', fontWeightStrong: 500 },
    Tabs: { titleFontSize: 14, horizontalItemPadding: '8px 0', horizontalItemGutter: 24 },
    Modal: { titleFontSize: 16 },
    Drawer: { titleFontSize: 16 },
    Form: { itemMarginBottom: 16, verticalLabelPadding: '0 0 4px' },
    Segmented: { trackBg: '#f5f2ee' },
    Progress: { defaultColor: '#ea580c' },
  },
}

// Mở hoặc tải lại trang: đổi cookie refresh lấy access token (nếu còn phiên), trước khi các trang cần quyền hiển thị.
function AuthBootstrap() {
  useEffect(() => { refreshSession() }, [])
  return null
}

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={theme}>
        {/* component={false}: bỏ lớp .ant-app, lớp đó ép màu và nền cho mọi thẻ a, thắng class Tailwind. */}
        <AntApp component={false}>
          <TooltipProvider>
            <AuthBootstrap />
            {children}
            <Toaster position="top-center" toastOptions={{ classNames: { toast: '!rounded-panel !border-brand-200 !font-sans', success: '!text-brand-900', error: '!text-danger' } }} />
          </TooltipProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
