import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Nisbiy yo'llar: sayt ham domen ildizida (Netlify, Vercel), ham
  // pastki papkada (GitHub Pages: /maqsadqoy/) bir xil ishlaydi.
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
})
