import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }, // import '@/services/api' thay cho '../../shared/api/api'
  // Dev: /api chuyển sang Spring Boot, cùng origin nên cookie refresh (SameSite=Strict) được gửi. Bản build dùng Nginx làm việc này.
  server: { proxy: { '/api': process.env.VITE_API_TARGET ?? 'http://localhost:8080' } },
})
