import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/be-vietnam-pro/800.css'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import Providers from '@/providers/AppProviders'
import { router } from '@/routes'
import { PageLoader } from '@/components/data/EmptyState'
import '@/styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </Providers>
  </StrictMode>,
)
