import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 이미지 및 업로드 파일을 VM 서버로 프록시
      '/uploads': {
        target: 'http://140.245.64.178',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
})
