import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // GitHub Pages 등 하위 경로 배포에서도 에셋이 깨지지 않도록 상대 경로
  server: { port: 5173 },
})
