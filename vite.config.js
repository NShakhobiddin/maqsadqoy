import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  /*
   * Manba kod app/ papkasida turadi, chunki repozitoriya root'i qurilgan
   * saytga ajratilgan (index.html + assets/). Bu GitHub Pages'ning
   * "Deploy from a branch → /(root)" rejimida saytni hech qanday
   * qo'shimcha sozlamasiz ochish imkonini beradi.
   */
  root: 'app',
  // Nisbiy yo'llar: sayt ham domen ildizida, ham pastki papkada
  // (GitHub Pages: /maqsadqoy/) bir xil ishlaydi.
  base: './',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: { host: true, port: 5173 },
})
